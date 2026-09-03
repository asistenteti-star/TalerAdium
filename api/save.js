/**
 * POST /api/save: puente entre la app y el Google Sheet del taller.
 *
 * Por qué existe esta función en lugar de llamar al Apps Script desde el
 * navegador: así la URL del Apps Script y el token compartido viven solo en
 * las variables de entorno de Vercel, la llamada es del mismo origen (no hay
 * CORS ni preflight que esquivar) y podemos leer la respuesta real para
 * mostrarle al equipo si su registro quedó guardado o no.
 *
 * Variables de entorno (Vercel → Settings → Environment Variables):
 *   SHEETS_WEBHOOK_URL    URL del despliegue del Apps Script (/exec)
 *   SHEETS_WEBHOOK_TOKEN  cadena compartida que el Apps Script verifica (opcional)
 *
 * Si SHEETS_WEBHOOK_URL no está definida, responde 501 y la app se queda
 * trabajando solo con su respaldo en localStorage.
 */

// Las columnas del registro. Tienen que coincidir con lo que envía
// collectData() en index.html y con COLUMNAS en el Apps Script: son tres
// listas que hay que mantener sincronizadas a mano, y `npm run check` falla
// si se separan. Ya pasó una vez: esta lista se quedó con los nombres de una
// versión anterior y descartaba en silencio el mensaje clave y el cierre que
// escribían los equipos.
const CAMPOS = [
  'equipo', 'paso_actual', 'pais', 'decisor',
  'meta', 'apertura', 'presion', 'relacion',
  'objecion', 'descripcion_decisor', 'dato_valor', 'herramienta_activa',
  'mensaje_clave', 'acciones_corto_plazo', 'acciones_mediano_plazo', 'indicadores',
  'cierre', 'listo_para_presentar',
];

const LIMITE_CARACTERES = 8000; // ninguna celda del taller necesita más

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Usa POST' });
  }

  const url = process.env.SHEETS_WEBHOOK_URL;
  if (!url) {
    return res.status(501).json({ error: 'SHEETS_WEBHOOK_URL no configurada' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Cuerpo JSON inválido' });
  }
  if (!body.equipo || typeof body.equipo !== 'string') {
    return res.status(400).json({ error: 'Falta el nombre del equipo' });
  }

  // Solo se reenvían los campos conocidos y recortados: el Sheet tiene un
  // encabezado fijo y no queremos que un payload arbitrario lo desalinee.
  const registro = {};
  for (const campo of CAMPOS) {
    const valor = body[campo];
    registro[campo] = typeof valor === 'string' ? valor.slice(0, LIMITE_CARACTERES) : '';
  }
  registro.token = process.env.SHEETS_WEBHOOK_TOKEN || '';
  registro.recibido_en = new Date().toISOString();

  try {
    const texto = await enviarAlAppsScript(url, registro);

    // Apps Script responde HTTP 200 incluso cuando rechaza el registro: el
    // veredicto viene en el cuerpo. Sin leerlo, un token equivocado se vería
    // como un guardado exitoso y nadie se enteraría hasta abrir el Sheet.
    const resultado = safeParse(texto);
    if (resultado && resultado.ok === false) {
      return res.status(502).json({ error: 'El Sheet rechazó el registro', detalle: resultado.error || '' });
    }
    if (!resultado) {
      return res.status(502).json({ error: 'El Sheet respondió algo que no es JSON', detalle: texto.slice(0, 200) });
    }
    return res.status(200).json({ ok: true, fila: resultado.fila });
  } catch (err) {
    return res.status(502).json({ error: 'No se pudo contactar el Sheet', detalle: String(err.message || err) });
  }
}

/**
 * Envía el registro y devuelve el cuerpo de la respuesta como texto.
 *
 * La redirección se sigue a mano y no con `redirect: 'follow'`. Apps Script
 * contesta 302 hacia script.googleusercontent.com, y si la segunda petición
 * arrastra la cabecera `Content-Type: application/json` de la primera, Google
 * la rechaza con 405 y una página de error HTML, aunque la escritura en el
 * Sheet ya se hizo. El resultado sería reportar un fallo sobre un guardado
 * exitoso. Siguiendo el salto con un GET limpio, sin cabeceras, la respuesta
 * llega como el JSON que devuelve el script.
 */
async function enviarAlAppsScript(url, registro) {
  const respuesta = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registro),
    redirect: 'manual',
  });

  if (respuesta.status >= 300 && respuesta.status < 400) {
    const destino = respuesta.headers.get('location');
    if (!destino) throw new Error('El Sheet redirigió sin indicar destino');
    const eco = await fetch(destino); // GET limpio, sin cabeceras heredadas
    const texto = await eco.text();
    if (!eco.ok) throw new Error(`El destino de la redirección respondió ${eco.status}`);
    return texto;
  }

  const texto = await respuesta.text();
  if (!respuesta.ok) throw new Error(`El Sheet respondió ${respuesta.status}: ${texto.slice(0, 200)}`);
  return texto;
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}

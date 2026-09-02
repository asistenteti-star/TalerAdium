/**
 * POST /api/save — puente entre la app y el Google Sheet del taller.
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

const CAMPOS = [
  'equipo','paso_actual','pais','decisor','meta',
  'apertura','presion','relacion','objecion','descripcion_decisor',
  'dato_tipo','dato_fuente','dato_valor','dato_adicional_texto',
  'herramienta_activa','escenario','desarrollo',
  'acciones_corto_plazo','acciones_largo_plazo','metricas',
  'reto','solucion','resultados_esperados','listo_para_presentar',
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
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registro),
      redirect: 'follow', // Apps Script redirige a script.googleusercontent.com
    });
    const texto = await upstream.text();
    if (!upstream.ok) {
      return res.status(502).json({ error: 'El Sheet rechazó el registro', detalle: texto.slice(0, 300) });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(502).json({ error: 'No se pudo contactar el Sheet', detalle: String(err.message || err) });
  }
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}

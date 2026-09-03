/**
 * TALLER FARMACOECONOMÍA APLICADA · ADIUM LATAM
 * Receptor de registros para el Google Sheet del taller.
 *
 * ─── Instalación ──────────────────────────────────────────────────────────
 * 1. Crea un Google Sheet nuevo. Su primera hoja debe llamarse "Registros".
 * 2. Extensiones → Apps Script. Borra el contenido y pega este archivo.
 * 3. Cambia TOKEN por la misma cadena que pondrás en Vercel como
 *    SHEETS_WEBHOOK_TOKEN (genera una con `openssl rand -hex 24`).
 * 4. Implementar → Nueva implementación → tipo "Aplicación web":
 *      · Ejecutar como: Yo
 *      · Quién tiene acceso: Cualquier persona
 *    Copia la URL que termina en /exec.
 * 5. En Vercel → Settings → Environment Variables:
 *      SHEETS_WEBHOOK_URL   = esa URL /exec
 *      SHEETS_WEBHOOK_TOKEN = el mismo token del paso 3
 * 6. Vuelve a desplegar el proyecto para que tome las variables.
 *
 * ─── Comportamiento ───────────────────────────────────────────────────────
 * El encabezado se verifica en cada escritura y se corrige si no coincide con
 * COLUMNAS, así que al cambiar la lista basta con volver a implementar: no
 * hace falta borrar la fila 1 a mano ni vaciar la hoja.
 *
 * Cada equipo ocupa UNA sola fila, identificada por el nombre del equipo.
 * Cada envío sobreescribe esa fila, así que la hoja siempre muestra el estado
 * actual de cada equipo en lugar de un histórico de miles de filas.
 * Los envíos se serializan con un lock para que dos equipos que guardan al
 * mismo tiempo no se pisen la fila.
 */

var TOKEN = 'CAMBIA_ESTE_TOKEN';
var HOJA = 'Registros';

var COLUMNAS = [
  'equipo', 'recibido_en', 'paso_actual', 'pais',
  'decisor', 'meta', 'apertura', 'presion',
  'relacion', 'objecion', 'descripcion_decisor', 'dato_valor',
  'herramienta_activa', 'mensaje_clave', 'acciones_corto_plazo', 'acciones_mediano_plazo',
  'indicadores', 'cierre', 'listo_para_presentar'
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Medido con 8 equipos simultáneos: Apps Script serializa las escrituras
    // a unos 2,8 s cada una, así que el último en la cola espera ~22 s. Con 45 s
    // hay margen para un salón de 15 equipos guardando a la vez.
    lock.waitLock(45000);

    var datos = JSON.parse(e.postData.contents);

    if (TOKEN !== 'CAMBIA_ESTE_TOKEN' && datos.token !== TOKEN) {
      return respuesta({ ok: false, error: 'token inválido' });
    }
    if (!datos.equipo) {
      return respuesta({ ok: false, error: 'falta el equipo' });
    }

    var hoja = obtenerHoja_();
    var fila = COLUMNAS.map(function (col) {
      return col === 'recibido_en'
        ? (datos.recibido_en || new Date().toISOString())
        : (datos[col] || '');
    });

    var indice = buscarFilaEquipo_(hoja, datos.equipo);
    if (indice > 0) {
      hoja.getRange(indice, 1, 1, COLUMNAS.length).setValues([fila]);
    } else {
      hoja.appendRow(fila);
    }

    return respuesta({ ok: true, fila: indice > 0 ? indice : hoja.getLastRow() });
  } catch (err) {
    return respuesta({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/** Permite abrir la URL /exec en el navegador para comprobar que está viva. */
function doGet() {
  return respuesta({ ok: true, servicio: 'Taller Adium · receptor de registros' });
}

function obtenerHoja_() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = libro.getSheetByName(HOJA) || libro.insertSheet(HOJA);

  if (hoja.getLastRow() === 0) {
    escribirEncabezado_(hoja);
    return hoja;
  }

  // El encabezado se verifica en cada escritura, no solo cuando la hoja está
  // vacía. Al cambiar la lista de columnas basta con dejar la fila 1 puesta
  // para que los datos caigan bajo etiquetas equivocadas sin que nada avise:
  // ya pasó, y desde la columna 12 todo quedó corrido una posición. Si el
  // encabezado no coincide, se corrige aquí mismo.
  var ancho = Math.max(hoja.getLastColumn(), COLUMNAS.length);
  var actual = hoja.getRange(1, 1, 1, ancho).getValues()[0];
  var coincide = true;
  for (var i = 0; i < COLUMNAS.length; i++) {
    if (String(actual[i] || '').trim() !== COLUMNAS[i]) { coincide = false; break; }
  }
  // Las columnas que sobran de una versión anterior también hay que limpiarlas.
  for (var j = COLUMNAS.length; j < ancho; j++) {
    if (String(actual[j] || '').trim() !== '') { coincide = false; break; }
  }
  if (!coincide) {
    if (ancho > COLUMNAS.length) {
      hoja.getRange(1, COLUMNAS.length + 1, 1, ancho - COLUMNAS.length).clearContent();
    }
    escribirEncabezado_(hoja);
  }
  return hoja;
}

function escribirEncabezado_(hoja) {
  hoja.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS]).setFontWeight('bold');
  hoja.setFrozenRows(1);
}

function buscarFilaEquipo_(hoja, equipo) {
  var ultima = hoja.getLastRow();
  if (ultima < 2) return -1;
  var nombres = hoja.getRange(2, 1, ultima - 1, 1).getValues();
  var buscado = String(equipo).trim().toLowerCase();
  for (var i = 0; i < nombres.length; i++) {
    if (String(nombres[i][0]).trim().toLowerCase() === buscado) return i + 2;
  }
  return -1;
}

function respuesta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Validación estática de index.html. `npm run check`
 *
 * El proyecto volvió a ser un archivo único, así que esta validación revisa lo
 * que se rompe con más frecuencia al editar HTML a mano: un error de sintaxis
 * en el script, un id duplicado, un `onclick` que llama a una función que ya
 * no existe, un id que el JS busca y no está, o una clase sin estilo.
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(raiz, 'index.html'), 'utf8');
const errores = [];
const avisos = [];

const css = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];
const js  = (html.match(/<script>([\s\S]*?)<\/script>/) || [, ''])[1];

/* 1. El script compila */
if (!js.trim()) errores.push('No encontré el bloque <script> del archivo');
else {
  try { new Function(js); }
  catch (e) { errores.push(`Error de sintaxis en el script: ${e.message}`); }
}

/* 2. Recursos referenciados que viven en el repositorio */
for (const r of [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1])) {
  // Los `${...}` son plantillas del JS, no rutas del repositorio.
  if (/^(https?:|#|mailto:|data:)/.test(r) || r.includes('${')) continue;
  if (!existsSync(join(raiz, r))) errores.push(`Recurso inexistente: ${r}`);
}

/* 3. Ids únicos */
const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
const repetidos = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
if (repetidos.length) errores.push(`Ids duplicados: ${repetidos.join(', ')}`);

/* 4. Cada función invocada desde un atributo del HTML está declarada */
const declaradas = new Set([...js.matchAll(/function\s+([A-Za-z_$][\w$]*)/g)].map(m => m[1]));
for (const f of new Set([...html.matchAll(/on\w+="([A-Za-z_$][\w$]*)\(/g)].map(m => m[1]))) {
  if (!declaradas.has(f) && !(f in globalThis)) {
    errores.push(`El HTML llama a ${f}() pero no está declarada`);
  }
}

/* 5. Los ids que el JS lee existen en el HTML o los genera el propio JS */
const idsHtml = new Set(ids);
for (const id of new Set([...js.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map(m => m[1]))) {
  if (!idsHtml.has(id) && !js.includes(`id="${id}"`)) {
    avisos.push(`El JS busca #${id} y no aparece en el HTML ni se genera dinámicamente`);
  }
}

/* 6. Marcadores de plantilla sin reemplazar que el usuario vería */
if (/PEGA_AQUI|TODO_REEMPLAZAR|CAMBIA_ESTE/.test(html)) {
  avisos.push('Queda un marcador de plantilla sin reemplazar (revisa APPS_SCRIPT_URL)');
}

/* 7. Las tres listas de columnas del registro coinciden.
   La app, el proxy y el Apps Script mantienen la misma lista a mano, y si se
   separan el campo se descarta en silencio: nadie se entera hasta abrir el
   Sheet y encontrar la columna vacía. Ya pasó con el mensaje clave y el
   cierre que escriben los equipos. */
const listaDe = (texto, patron) => {
  const m = texto.match(patron);
  return m ? [...m[0].matchAll(/'([a-z_]+)'/g)].map(x => x[1]) : null;
};
const enviados = [...(js.match(/function collectData\(\)\{[\s\S]*?\n\}/) || [''])[0]
  .matchAll(/^\s+([a-z_]+):/gm)].map(m => m[1]);
const proxy = listaDe(readFileSync(join(raiz, 'api/save.js'), 'utf8'), /const CAMPOS = \[[\s\S]*?\];/);
const hoja  = listaDe(readFileSync(join(raiz, 'docs/AppsScript_TallerAdium.gs'), 'utf8'), /var COLUMNAS = \[[\s\S]*?\];/);

if (!enviados.length) avisos.push('No pude leer los campos de collectData()');
else if (!proxy || !hoja) avisos.push('No pude leer las listas de columnas del proxy o del Apps Script');
else {
  const faltanProxy = enviados.filter(c => !proxy.includes(c));
  const faltanHoja  = enviados.filter(c => !hoja.includes(c));
  const sobranHoja  = hoja.filter(c => c !== 'recibido_en' && !enviados.includes(c));
  if (faltanProxy.length) errores.push(`api/save.js descarta campos que la app envía: ${faltanProxy.join(', ')}`);
  if (faltanHoja.length)  errores.push(`El Apps Script no tiene columna para: ${faltanHoja.join(', ')}`);
  if (sobranHoja.length)  avisos.push(`Columnas del Sheet que ya nadie llena: ${sobranHoja.join(', ')}`);
}

/* 8. Clases usadas sin definición en el CSS */
const clasesCss = new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(m => m[1]));
const usadas = new Set();
for (const m of html.matchAll(/class="([^"$]*)"/g)) m[1].split(/\s+/).forEach(c => c && usadas.add(c));
for (const m of js.matchAll(/className\s*=\s*'([^']*)'/g)) m[1].split(/\s+/).forEach(c => c && usadas.add(c));
for (const m of js.matchAll(/classList\.(?:add|remove|toggle)\(\s*['"]([\w-]+)/g)) usadas.add(m[1]);
const sinEstilo = [...usadas].filter(c => !clasesCss.has(c) && !c.includes('${'));
if (sinEstilo.length) avisos.push(`Clases sin definición en CSS: ${sinEstilo.join(', ')}`);

/* — Informe — */
for (const a of avisos) console.log(`AVISO   ${a}`);
for (const e of errores) console.error(`ERROR   ${e}`);
console.log(`\n${ids.length} ids · ${js.split('\n').length} líneas de script · ${css.split('\n').length} de CSS · ${errores.length} errores · ${avisos.length} avisos`);
process.exit(errores.length ? 1 : 0);

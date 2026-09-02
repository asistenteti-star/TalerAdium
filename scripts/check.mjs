/**
 * Validación estática del sitio. `npm run check`
 *
 * No reemplaza probar la app en el navegador, pero atrapa lo que se rompe
 * con más frecuencia al editar un sitio sin build: un <script> que apunta a
 * un archivo que ya no existe, un `onclick="foo()"` cuya función se renombró,
 * un id duplicado o un error de sintaxis en un archivo de datos.
 */

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(raiz, 'index.html'), 'utf8');
const errores = [];
const avisos = [];

/* 1 — Todos los recursos referenciados existen */
const recursos = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map(m => m[1])
  .filter(r => !/^(https?:|#|mailto:|data:)/.test(r));
for (const r of recursos) {
  if (!existsSync(join(raiz, r))) errores.push(`Recurso inexistente: ${r}`);
}

/* 2 — Cada archivo JS compila */
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
for (const s of scripts) {
  try {
    execFileSync(process.execPath, ['--check', join(raiz, s)], { stdio: 'pipe' });
  } catch (e) {
    errores.push(`Error de sintaxis en ${s}:\n${e.stderr?.toString().trim()}`);
  }
}
try {
  execFileSync(process.execPath, ['--check', join(raiz, 'api/save.js')], { stdio: 'pipe' });
} catch (e) {
  errores.push(`Error de sintaxis en api/save.js:\n${e.stderr?.toString().trim()}`);
}

/* 3 — Ids únicos */
const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
const repetidos = ids.filter((id, i) => ids.indexOf(id) !== i);
if (repetidos.length) errores.push(`Ids duplicados: ${[...new Set(repetidos)].join(', ')}`);

/* 4 — Cada función invocada desde el HTML está declarada en algún script */
const fuente = scripts.map(s => readFileSync(join(raiz, s), 'utf8')).join('\n');
const declaradas = new Set([...fuente.matchAll(/function\s+([A-Za-z_$][\w$]*)/g)].map(m => m[1]));
const invocadas = new Set([...html.matchAll(/on\w+="([A-Za-z_$][\w$]*)\(/g)].map(m => m[1]));
for (const f of invocadas) {
  if (!declaradas.has(f)) errores.push(`El HTML llama a ${f}() pero no está declarada en ningún script`);
}

/* 5 — Ningún identificador global se declara dos veces.
   Los scripts son clásicos y comparten un solo ámbito global: dos `let` con
   el mismo nombre en archivos distintos rompen la página completa con
   "Identifier has already been declared". */
const globales = new Map();
for (const s of scripts) {
  const texto = readFileSync(join(raiz, s), 'utf8');
  for (const m of texto.matchAll(/^(?:let|const|var|function)\s+([A-Za-z_$][\w$]*)/gm)) {
    const previo = globales.get(m[1]);
    if (previo && previo !== s) errores.push(`${m[1]} se declara en ${previo} y otra vez en ${s}`);
    else globales.set(m[1], s);
  }
}

/* 6 — Los ids que el JS lee deben existir en el HTML o generarse en el JS */
const leidos = new Set([...fuente.matchAll(/getElementById\('([^']+)'\)/g)].map(m => m[1]));
const idsHtml = new Set(ids);
for (const id of leidos) {
  if (!idsHtml.has(id) && !fuente.includes(`id="${id}"`)) {
    avisos.push(`El JS busca #${id} y no aparece en el HTML ni se genera dinámicamente`);
  }
}

/* 7 — No quedaron marcadores de plantilla sin reemplazar */
for (const [archivo, texto] of [['index.html', html], ['scripts', fuente]]) {
  if (/PEGA_AQUI|TODO_REEMPLAZAR|CAMBIA_ESTE/.test(texto)) {
    errores.push(`Quedó un marcador sin reemplazar en ${archivo}`);
  }
}

/* 8 — La plantilla del Apps Script no debe llevar el token real.
   El repositorio es público: el archivo de docs/ es una plantilla y el token
   se pega únicamente en el editor de Apps Script. Si alguien guarda aquí el
   valor real y lo sube, queda expuesto junto con la URL del webhook. */
const plantillaGs = readFileSync(join(raiz, 'docs/AppsScript_TallerAdium.gs'), 'utf8');
if (!plantillaGs.includes("var TOKEN = 'CAMBIA_ESTE_TOKEN'")) {
  errores.push('docs/AppsScript_TallerAdium.gs ya no tiene el marcador CAMBIA_ESTE_TOKEN: ' +
    'parece que se guardó un token real en una plantilla de un repositorio público. ' +
    'Restaura el marcador y deja el token solo en el editor de Apps Script.');
}

/* 9 — Los estilos usados existen */
const css = readFileSync(join(raiz, 'assets/css/styles.css'), 'utf8');
const clasesCss = new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(m => m[1]));
const clasesUsadas = new Set();
for (const m of html.matchAll(/class="([^"]*)"/g)) m[1].split(/\s+/).forEach(c => c && clasesUsadas.add(c));
for (const m of fuente.matchAll(/className\s*=\s*'([^']*)'/g)) m[1].split(/\s+/).forEach(c => c && clasesUsadas.add(c));
for (const m of fuente.matchAll(/class="([^"$]*)"/g)) m[1].split(/\s+/).forEach(c => c && clasesUsadas.add(c));
const sinEstilo = [...clasesUsadas].filter(c => !clasesCss.has(c) && !c.includes('${'));
if (sinEstilo.length) avisos.push(`Clases sin definición en CSS: ${sinEstilo.join(', ')}`);

/* — Informe — */
for (const a of avisos) console.log(`AVISO   ${a}`);
for (const e of errores) console.error(`ERROR   ${e}`);
console.log(`\n${scripts.length} scripts · ${recursos.length} recursos · ${ids.length} ids · ${errores.length} errores · ${avisos.length} avisos`);
process.exit(errores.length ? 1 : 0);

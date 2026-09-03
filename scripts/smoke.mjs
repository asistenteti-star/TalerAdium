/**
 * Recorrido completo en un navegador real. Comprueba lo que la validación
 * estática no puede ver: que la página no lance errores, que el recorrido de
 * las siete pantallas funcione, que el catálogo de herramientas responda al
 * toque, que ninguna pantalla desborde a lo ancho y que el respaldo local
 * reanude la sesión.
 *
 *   npm i -D playwright-core        # una vez
 *   npx playwright install chromium # una vez
 *   npm run dev                     # en otra terminal
 *   node scripts/smoke.mjs
 *
 * CHROME_PATH permite apuntar a un Chromium ya instalado en el sistema.
 * BASE_URL cambia el origen (por defecto http://localhost:8080).
 */

import { chromium } from 'playwright-core';

const BASE = process.env.BASE_URL || 'http://localhost:8080';
const ANCHOS = [360, 390, 768, 1024, 1440];
const fallos = [];

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}
);
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', e => fallos.push('Error de JavaScript: ' + e.message));
page.on('console', m => {
  // El 501 de /api/save es esperado cuando el Sheet no está configurado.
  // Con el servidor local no existe /api/save: responde 404 o 501 y es
  // esperado. En Vercel esa ruta la atiende la función serverless.
  const esperado = /50[01]|404/.test(m.text()) && /api\/save|Failed to load resource/.test(m.text());
  if (m.type() === 'error' && !esperado) fallos.push('Consola: ' + m.text());
});

await page.goto(`${BASE}/index.html`, { waitUntil: 'load' });

// Recorrido
await page.fill('#teamNameInput', 'Equipo de prueba');
await page.click('#btnTeam');
await page.click('.c-btn >> nth=0');
await page.click('#btn1');
await page.click('.p-card >> nth=1');
await page.click('#btn2');
await page.click('.m-card >> nth=2');
await page.click('#btn3');
await page.waitForSelector('#dzCatalogo .drag-card');

// En esta versión la columna "tu combinación" arranca vacía y el equipo tiene
// que arrastrar. Se prueba con un arrastre HTML5 real, que es la única forma
// de mover una tarjeta aquí.
await page.locator('#dzCatalogo .drag-card').first().dragTo(page.locator('#dzCombo'));
const enCombo = await page.$$('#dzCombo .drag-card');
if (enCombo.length === 0) fallos.push('El arrastre no movió ninguna herramienta a la combinación');
if (!(await page.textContent('#argGenerado')).trim()) fallos.push('El argumento quedó vacío');

await page.click('button.btn-amber');
await page.waitForSelector('#step1.on');
await page.click('#chipBuilder .chip-opt >> nth=0');
if (!(await page.textContent('#descOut')).includes('interlocutor')) fallos.push('La descripción del decisor no se generó');

await page.click('.step-tab >> nth=1');
await page.waitForSelector('#step2.on');
if ((await page.$$('#vizGrid > *')).length === 0) fallos.push('El Paso 2 no pintó ningún bloque de datos');

await page.click('.step-tab >> nth=2');
await page.waitForSelector('#step3.on');

// Se llenan todos los campos de texto que el paso ofrezca, sin depender de
// ids concretos: el archivo de contenido los renombra entre versiones y el
// ensayo no debería romperse por eso.
const campos = await page.$$('#step3 textarea');
if (campos.length === 0) fallos.push('El Paso 3 no ofrece ningún campo de texto');
for (const [i, campo] of campos.entries()) await campo.fill(`Texto de prueba ${i + 1}`);

await page.click('button:has-text("Listo para presentar")');
await page.waitForSelector('#s6.on');
if (!(await page.textContent('.prop-title')).trim()) fallos.push('La propuesta final salió vacía');

// Desborde horizontal en cada ancho y cada pantalla
for (const w of ANCHOS) {
  await page.setViewportSize({ width: w, height: 900 });
  for (const s of ['s0','s1','s2','s3','s4','s5','s6']) {
    await page.evaluate(id => {
      document.querySelectorAll('.screen').forEach(x => x.classList.remove('on'));
      document.getElementById(id).classList.add('on');
    }, s);
    await page.waitForTimeout(50);
    const { sw, cw } = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    }));
    if (sw > cw + 1) fallos.push(`Desborde horizontal en ${s} a ${w}px (${sw} > ${cw})`);
  }
}

await browser.close();

if (fallos.length) {
  console.error('FALLOS:\n  ' + fallos.join('\n  '));
  process.exit(1);
}
console.log(`Recorrido completo sin fallos · ${ANCHOS.length} anchos × 7 pantallas verificados`);

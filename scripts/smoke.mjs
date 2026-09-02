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
  if (m.type() === 'error' && !m.text().includes('501')) fallos.push('Consola: ' + m.text());
});

await page.goto(`${BASE}/index.html`, { waitUntil: 'load' });

// — Recorrido —
await page.fill('#teamNameInput', 'Equipo de prueba');
await page.click('#btnTeam');
await page.click('.c-btn >> nth=0');
await page.click('#btn1');
await page.click('.p-card >> nth=1');
await page.click('#btn2');
await page.click('.m-card >> nth=2');
await page.click('#btn3');
await page.waitForSelector('#dzCombo .drag-card');

const antes = await page.$$eval('#dzCombo .drag-card', e => e.length);
await page.click('#dzCatalogo .drag-card >> nth=0');
const despues = await page.$$eval('#dzCombo .drag-card', e => e.length);
if (despues <= antes) fallos.push('El toque no movió la herramienta a la combinación');
if (!(await page.textContent('#argGenerado')).trim()) fallos.push('El argumento quedó vacío');

await page.click('button.btn-amber');
await page.waitForSelector('#step1.on');
await page.click('#chipBuilder .chip-opt >> nth=0');
if (!(await page.textContent('#descOut')).includes('interlocutor')) fallos.push('La descripción del decisor no se generó');

await page.click('.step-tab >> nth=1');
await page.waitForSelector('#step2.on');
if ((await page.$$('.viz-card')).length === 0) fallos.push('No se pintaron las tarjetas de datos');

await page.click('.step-tab >> nth=2');
await page.waitForSelector('#step3.on');
await page.click('#suggEscenario .sugg-chip >> nth=0');
if (!(await page.inputValue('#ta-escenario'))) fallos.push('La frase sugerida no se insertó');
await page.fill('#ta-metricas', 'Métrica de prueba');
await page.click('button:has-text("Listo para presentar")');
await page.waitForSelector('#s6.on');
if (!(await page.textContent('.prop-title')).trim()) fallos.push('La propuesta final salió vacía');

// — Desborde horizontal en cada ancho y cada pantalla —
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

// — Reanudar sesión —
const p2 = await browser.newPage({ viewport: { width: 390, height: 844 } });
await p2.goto(`${BASE}/index.html`);
if (await p2.isVisible('#resumeBar')) fallos.push('La barra de reanudar aparece en una primera visita');
await p2.fill('#teamNameInput', 'Equipo reanudado');
await p2.click('#btnTeam');
await p2.click('.c-btn >> nth=0');
await p2.waitForTimeout(1500);
await p2.reload();
await p2.waitForTimeout(400);
if (!(await p2.isVisible('#resumeBar'))) fallos.push('La barra de reanudar no apareció tras recargar');
await p2.click('#btnResume');
await p2.waitForTimeout(400);
if (await p2.evaluate(() => document.querySelector('.screen.on').id) === 's0') {
  fallos.push('Reanudar dejó la app en la pantalla inicial');
}

await browser.close();

if (fallos.length) {
  console.error('FALLOS:\n  ' + fallos.join('\n  '));
  process.exit(1);
}
console.log(`Recorrido completo sin fallos · ${ANCHOS.length} anchos × 7 pantallas verificados`);

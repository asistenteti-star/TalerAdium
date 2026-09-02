/* ═══ INTERFAZ COMPARTIDA ═══
   Helpers que usan los dos módulos: iconos, enlaces externos, listas de
   evidencia y el selector de tema. */

/** Devuelve el marcado de un icono del sprite incrustado en index.html. */
function icon(nombre, clase){
  return `<svg class="ic${clase ? ' ' + clase : ''}" aria-hidden="true"><use href="#ic-${nombre}"></use></svg>`;
}

/** Bandera del país. Los emoji de bandera son dos codepoints y varias fuentes
    los dibujan sin margen lateral, así que el espacio del texto no basta: pegan
    con la palabra siguiente. En su propio elemento el espaciado es explícito. */
function bandera(emoji){
  return `<span class="bandera" aria-hidden="true">${emoji}</span>`;
}

/** Sigla de la herramienta o del perfil, como distintivo junto al icono. */
function sigla(texto){
  return `<span class="sigla">${texto}</span>`;
}

/** Enlace a una fuente externa. El icono reemplaza a la flecha ↗ que se usaba
    como texto y que en algunas tipografías no se renderizaba. */
function enlaceExterno(url, texto){
  return `<a class="link-ext" href="${url}" target="_blank" rel="noopener">${texto}${icon('external')}</a>`;
}

/** Lista de papers. Un solo lugar para las cuatro copias que había repartidas
    entre module1, module2 y proposal. */
function listaEvidencia(claves, textoEnlace){
  return [...new Set(claves)].map(k=>{
    const e = EVREF[k];
    if(!e) return '';
    return `<li class="ev-item">
      <div class="ev-paper">${e.paper}</div>
      <div class="ev-result">${e.result}</div>
      ${enlaceExterno(e.url, textoEnlace || e.url)}
    </li>`;
  }).join('');
}

function bloqueEvidencia(claves, etiqueta, textoEnlace){
  const items = listaEvidencia(claves, textoEnlace);
  if(!items) return '';
  return `<div class="ev-block">
    <div class="ev-lbl">${etiqueta}</div>
    <ul class="ev-list">${items}</ul>
  </div>`;
}

/* ═══ TEMA CLARO Y OSCURO ═══
   La preferencia elegida gana sobre la del sistema y se recuerda. Sin
   elección guardada se sigue al sistema, que es lo que el visitante espera. */

const TEMA_KEY = 'taller-adium-tema';

function temaActual(){
  const puesto = document.documentElement.dataset.theme;
  if(puesto) return puesto;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function aplicarTema(tema){
  document.documentElement.dataset.theme = tema;
  try{ localStorage.setItem(TEMA_KEY, tema); }catch(e){}
  pintarBotonTema();
  pintarLogos();
}

function pintarBotonTema(){
  const btn = document.getElementById('themeToggle');
  if(!btn) return;
  const claro = temaActual() === 'light';
  // El botón muestra el tema al que se va a cambiar, no el actual.
  btn.innerHTML = icon(claro ? 'moon' : 'sun') +
    `<span class="sr-only">Cambiar a tema ${claro ? 'oscuro' : 'claro'}</span>`;
  btn.setAttribute('title', `Cambiar a tema ${claro ? 'oscuro' : 'claro'}`);
}

/* El logotipo es blanco o tinta según el fondo: no se puede recolorear con
   CSS como un icono, así que se cambia el archivo con el tema. */
function pintarLogos(){
  const claro = temaActual() === 'light';
  const archivo = claro ? 'assets/brand/alzak-oscuro.png' : 'assets/brand/alzak-claro.png';
  document.querySelectorAll('.logo-img,.pie-logo').forEach(img => {
    if(!img.src.endsWith(archivo)) img.src = archivo;
  });
}

function initTema(){
  pintarBotonTema();
  pintarLogos();
  const btn = document.getElementById('themeToggle');
  if(btn) btn.addEventListener('click', ()=> aplicarTema(temaActual() === 'light' ? 'dark' : 'light'));

  // Si el equipo nunca eligió, seguimos al sistema aunque cambie a mitad de
  // sesión (por ejemplo con el modo oscuro automático al atardecer).
  let guardado = null;
  try{ guardado = localStorage.getItem(TEMA_KEY); }catch(e){}
  if(!guardado){
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', ()=>{
      pintarBotonTema();
      pintarLogos();
    });
  }
}

/* ═══ IMPRESIÓN Y ACORDEONES ═══
   El contenido de un <details> cerrado no se imprime: el navegador no lo
   incluye en el documento paginado. Como las fichas de país y el detalle de
   las herramientas ahora son acordeones, se abren todos antes de imprimir y
   se devuelven a su estado al terminar. Sin esto, la propuesta saldría con
   los títulos y sin el contenido. */

let acordeonesCerrados = [];

function abrirTodoParaImprimir(){
  acordeonesCerrados = Array.from(document.querySelectorAll('details:not([open])'));
  acordeonesCerrados.forEach(d => d.open = true);
}

function restaurarAcordeones(){
  acordeonesCerrados.forEach(d => d.open = false);
  acordeonesCerrados = [];
}

window.addEventListener('beforeprint', ()=>{
  abrirTodoParaImprimir();
  // El aspecto de papel está definido una sola vez, en `.paper`. Ponerlo en
  // el <html> al imprimir garantiza que el PDF salga igual que la vista
  // previa, sin una segunda copia de los colores en la hoja de impresión.
  document.documentElement.classList.add('paper');
});
window.addEventListener('afterprint', ()=>{
  restaurarAcordeones();
  document.documentElement.classList.remove('paper');
});

/* ═══ PREVISUALIZACIÓN ═══
   En escritorio el navegador ya muestra su propia vista previa al imprimir.
   En iOS no hay diálogo: la impresión sale por la hoja de compartir y el
   equipo termina guardando un PDF que no vio. Esta capa iguala las dos
   plataformas, y de paso marca dónde se va a cortar cada hoja.

   La hoja se monta en un iframe de 182mm de ancho, el mismo ancho útil que
   declara @page. No es un detalle de implementación: las consultas de medios
   responden al ancho del viewport, y al imprimir en A4 ese ancho son 688px,
   así que las reglas de pantalla estrecha también aplican en el papel. Con la
   maqueta dentro de un iframe de 688px, las reglas resuelven exactamente como
   en la impresión, sin reafirmar a mano regla por regla. */

const HOJA_ANCHO_MM = 182;   // A4 (210mm) menos 14mm de margen a cada lado
const HOJA_ALTO_MM  = 269;   // A4 (297mm) menos 14mm arriba y abajo
const PX_POR_MM = 96 / 25.4;

function abrirPrevisualizacion(){
  const propBox = document.getElementById('propBox');
  if(!propBox || !propBox.innerHTML.trim()) return;

  let capa = document.getElementById('previewLayer');
  if(!capa){
    capa = document.createElement('div');
    capa.id = 'previewLayer';
    capa.className = 'preview';
    capa.setAttribute('role','dialog');
    capa.setAttribute('aria-modal','true');
    capa.setAttribute('aria-label','Vista previa del documento');
    document.body.appendChild(capa);
  }

  capa.innerHTML = `
    <div class="preview-bar paper">
      <div class="preview-title">Vista previa del documento
        <span id="previewPaginas">preparando…</span></div>
      <button type="button" class="btn-g" id="previewCerrar">Volver a editar</button>
      <button type="button" class="btn-p" id="previewImprimir">
        ${icon('printer')} Guardar PDF o imprimir</button>
    </div>
    <div class="preview-scroll">
      <div class="preview-sheet">
        <iframe id="previewFrame" class="preview-frame" title="Documento en tamaño A4"></iframe>
        <div class="preview-guides"></div>
      </div>
      <p class="preview-nota">Las líneas rojas marcan dónde termina cada hoja.
        Al guardar, el navegador corta ahí mismo.</p>
    </div>`;

  document.getElementById('previewCerrar').onclick = cerrarPrevisualizacion;
  document.getElementById('previewImprimir').onclick = ()=> window.print();
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', cerrarConEscape);

  montarHoja(propBox.innerHTML);
  window.addEventListener('resize', ajustarEscalaPrevisualizacion);
  document.getElementById('previewCerrar').focus();
}

/* Escribe la propuesta dentro del iframe, con la misma hoja de estilos y el
   mismo sprite de iconos: los <use href="#ic-…"> se resuelven dentro del
   documento que los contiene, así que el sprite tiene que viajar con ellos. */
function montarHoja(contenido){
  const marco = document.getElementById('previewFrame');
  if(!marco) return;
  marco.style.width = (HOJA_ANCHO_MM * PX_POR_MM) + 'px';

  const sprite = document.querySelector('body > svg[aria-hidden="true"]');
  const doc = marco.contentDocument;
  doc.open();
  doc.write(`<!doctype html><html class="paper" lang="es"><head><meta charset="utf-8">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap">
    <link rel="stylesheet" href="assets/css/styles.css" id="hojaPreview">
    <style>
      html,body{background:#fff;min-height:0}
      body{padding:0}
      .prop-wrap{border:none;border-radius:0;margin:0;background:#fff}
      .btn-row,.no-print{display:none}
    </style></head><body></body></html>`);
  doc.close();

  if(sprite) doc.body.appendChild(sprite.cloneNode(true));
  const caja = doc.createElement('div');
  caja.innerHTML = contenido;
  caja.querySelectorAll('details').forEach(d => d.open = true);
  caja.querySelectorAll('.no-print').forEach(el => el.remove());
  while(caja.firstChild) doc.body.appendChild(caja.firstChild);

  // La maqueta no se puede medir hasta que la hoja de estilos y las fuentes
  // estén listas; medirla antes daría un número de hojas equivocado.
  const listo = ()=> (doc.fonts ? doc.fonts.ready : Promise.resolve()).then(ajustarEscalaPrevisualizacion);
  const hoja = doc.getElementById('hojaPreview');
  if(hoja && !hoja.sheet) hoja.addEventListener('load', listo, { once:true });
  else listo();
}

/* La hoja mide 182mm, unos 688px, que no caben en un teléfono. Se reduce para
   que entre completa en lugar de obligar a desplazarse a lo ancho, que es
   justo lo que impide juzgar una maqueta. */
function ajustarEscalaPrevisualizacion(){
  const capa = document.getElementById('previewLayer');
  if(!capa) return;
  const scroll = capa.querySelector('.preview-scroll');
  const sheet  = capa.querySelector('.preview-sheet');
  const marco  = document.getElementById('previewFrame');
  if(!scroll || !sheet || !marco || !marco.contentDocument) return;

  const anchoHoja = HOJA_ANCHO_MM * PX_POR_MM;
  const altoHoja  = HOJA_ALTO_MM * PX_POR_MM;

  // El iframe crece hasta el alto de su contenido, redondeado a hojas enteras,
  // para que la última página se vea completa y no cortada a media caja.
  const alto = marco.contentDocument.body.scrollHeight;
  const hojas = Math.max(1, Math.ceil(alto / altoHoja));
  marco.style.height = (hojas * altoHoja) + 'px';
  sheet.style.height = (hojas * altoHoja) + 'px';

  const escala = Math.min(1, (scroll.clientWidth - 24) / anchoHoja);
  sheet.style.setProperty('--preview-scale', escala.toFixed(4));
  // Con transform la caja sigue ocupando su alto sin escalar: hay que
  // descontar la diferencia o queda un hueco al final del desplazamiento.
  sheet.style.marginBottom = escala < 1 ? `${-(hojas * altoHoja) * (1 - escala)}px` : '';
  sheet.style.marginInline = escala < 1 ? '0' : 'auto';

  const etiqueta = document.getElementById('previewPaginas');
  if(etiqueta) etiqueta.textContent = `${hojas} ${hojas === 1 ? 'hoja' : 'hojas'} en A4`;
}

function cerrarPrevisualizacion(){
  const capa = document.getElementById('previewLayer');
  if(capa) capa.remove();
  document.body.style.overflow = '';
  document.removeEventListener('keydown', cerrarConEscape);
  window.removeEventListener('resize', ajustarEscalaPrevisualizacion);
  const btn = document.getElementById('btnPreview');
  if(btn) btn.focus();
}

function cerrarConEscape(e){
  if(e.key === 'Escape') cerrarPrevisualizacion();
}

/* El año del pie se toma del reloj: el taller es en octubre de 2026 pero la
   herramienta puede volver a usarse en ediciones siguientes. */
document.addEventListener('DOMContentLoaded', ()=>{
  const anio = document.getElementById('pieAnio');
  if(anio) anio.textContent = String(new Date().getFullYear());
});

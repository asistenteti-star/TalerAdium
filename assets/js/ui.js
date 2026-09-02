/* ═══ INTERFAZ COMPARTIDA ═══
   Helpers que usan los dos módulos: iconos, enlaces externos, listas de
   evidencia y el selector de tema. */

/** Devuelve el marcado de un icono del sprite incrustado en index.html. */
function icon(nombre, clase){
  return `<svg class="ic${clase ? ' ' + clase : ''}" aria-hidden="true"><use href="#ic-${nombre}"></use></svg>`;
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

   La hoja se dibuja en milímetros reales, con el mismo ancho útil que declara
   @page, así que el corte que marca la guía es el que hará el navegador. */

const HOJA_ALTO_MM = 269;   // A4 (297mm) menos 14mm de margen arriba y abajo

function abrirPrevisualizacion(){
  const propBox = document.getElementById('propBox');
  if(!propBox || !propBox.innerHTML.trim()) return;

  let capa = document.getElementById('previewLayer');
  if(!capa){
    capa = document.createElement('div');
    capa.id = 'previewLayer';
    capa.className = 'preview paper';
    capa.setAttribute('role','dialog');
    capa.setAttribute('aria-modal','true');
    capa.setAttribute('aria-label','Vista previa del documento');
    document.body.appendChild(capa);
  }

  capa.innerHTML = `
    <div class="preview-bar">
      <div class="preview-title">Vista previa del documento
        <span id="previewPaginas"></span></div>
      <button type="button" class="btn-g" id="previewCerrar">Volver a editar</button>
      <button type="button" class="btn-p" id="previewImprimir">
        ${icon('printer')} Guardar PDF o imprimir</button>
    </div>
    <div class="preview-scroll">
      <div class="preview-sheet">
        <div class="preview-page" id="previewHoja">
          <div class="preview-guides"></div>
          <div id="previewContenido"></div>
        </div>
      </div>
      <p class="preview-nota">Las líneas rojas marcan dónde termina cada hoja.
        Al guardar, el navegador corta ahí mismo.</p>
    </div>`;

  // Se clona el contenido ya construido en lugar de rearmarlo: la vista previa
  // muestra exactamente lo que el equipo tiene, no una segunda versión.
  const contenido = document.getElementById('previewContenido');
  contenido.innerHTML = propBox.innerHTML;
  contenido.querySelectorAll('details').forEach(d => d.open = true);
  contenido.querySelectorAll('.no-print').forEach(el => el.remove());

  document.getElementById('previewCerrar').onclick = cerrarPrevisualizacion;
  document.getElementById('previewImprimir').onclick = ()=> window.print();
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', cerrarConEscape);

  ajustarEscalaPrevisualizacion();
  window.addEventListener('resize', ajustarEscalaPrevisualizacion);
  document.getElementById('previewCerrar').focus();
}

/* La hoja mide 182mm de ancho, unos 688px, que no caben en un teléfono. Se
   reduce para que entre completa en lugar de obligar a desplazarse a lo
   ancho, que es justo lo que impide juzgar una maqueta. */
function ajustarEscalaPrevisualizacion(){
  const capa = document.getElementById('previewLayer');
  if(!capa) return;
  const scroll = capa.querySelector('.preview-scroll');
  const hoja = capa.querySelector('.preview-sheet');
  if(!scroll || !hoja) return;

  hoja.style.setProperty('--preview-scale', '1');
  const disponible = scroll.clientWidth - 24;
  const anchoHoja = hoja.getBoundingClientRect().width;
  const escala = Math.min(1, disponible / anchoHoja);
  hoja.style.setProperty('--preview-scale', escala.toFixed(4));

  // Con transform la caja sigue ocupando su alto original, así que el
  // contenedor necesita compensarlo para no dejar un hueco al final.
  // Con transform la caja sigue ocupando su alto sin escalar, así que hay que
  // descontar la diferencia o queda un hueco al final del desplazamiento.
  const alto = hoja.getBoundingClientRect().height;
  hoja.style.marginBottom = escala < 1 ? `${(alto / escala - alto) * -1}px` : '';
  // A escala 1 la hoja se centra; reducida, arranca pegada al borde izquierdo.
  hoja.style.marginLeft = escala < 1 ? '0' : 'auto';
  hoja.style.marginRight = escala < 1 ? '0' : 'auto';

  contarHojas();
}

function contarHojas(){
  const capa = document.getElementById('previewLayer');
  const contenido = capa && capa.querySelector('#previewContenido');
  const etiqueta = capa && capa.querySelector('#previewPaginas');
  if(!contenido || !etiqueta) return;
  // 1mm = 96/25.4 px en CSS.
  const altoHojaPx = HOJA_ALTO_MM * (96 / 25.4);
  const hojas = Math.max(1, Math.ceil(contenido.scrollHeight / altoHojaPx));
  etiqueta.textContent = `${hojas} ${hojas === 1 ? 'hoja' : 'hojas'} en A4`;
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

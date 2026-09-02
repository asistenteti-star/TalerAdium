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

function initTema(){
  pintarBotonTema();
  const btn = document.getElementById('themeToggle');
  if(btn) btn.addEventListener('click', ()=> aplicarTema(temaActual() === 'light' ? 'dark' : 'light'));

  // Si el equipo nunca eligió, seguimos al sistema aunque cambie a mitad de
  // sesión (por ejemplo con el modo oscuro automático al atardecer).
  let guardado = null;
  try{ guardado = localStorage.getItem(TEMA_KEY); }catch(e){}
  if(!guardado){
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', pintarBotonTema);
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

window.addEventListener('beforeprint', abrirTodoParaImprimir);
window.addEventListener('afterprint', restaurarAcordeones);

/* ═══ PERSISTENCIA ═══
   Dos capas independientes:
   1. localStorage — respaldo local inmediato. Si el equipo recarga la página
      o se le cierra el navegador a mitad del taller, no pierde el trabajo.
   2. /api/save — función serverless que reenvía el registro al Google Sheet.
      El navegador nunca ve la URL del Apps Script ni las credenciales.
      Si la variable de entorno no está configurada en Vercel, /api/save
      responde 501 y la app sigue funcionando solo con el respaldo local. */

const STORAGE_KEY = 'taller-adium-v1';
const SAVE_ENDPOINT = '/api/save';
const SAVE_DEBOUNCE_MS = 1200;

let saveDebounceTimer = null;
let remoteSaveDisabled = false;

function setSaveIndicator(state){
  const el = document.getElementById('saveIndicator');
  if(!el) return;
  const dot = (color) => `<span aria-hidden="true" style="width:6px;height:6px;border-radius:50%;background:${color};display:inline-block"></span>`;
  if(state==='saving')     el.innerHTML = dot('#c47f00') + ' Guardando…';
  else if(state==='saved') el.innerHTML = dot('var(--teal)') + ' Guardado';
  else if(state==='local') el.innerHTML = dot('var(--gray)') + ' Guardado en este equipo';
  else if(state==='error') el.innerHTML = dot('#c94b4b') + ' Sin conexión — respaldo local';
  else el.innerHTML = '';
}

function currentStepLabel(){
  const active = document.querySelector('.screen.on');
  if(!active) return '';
  const map = { s0:'Módulo 1 · Nombre de equipo', s1:'Módulo 1 · Paso 1 País', s2:'Módulo 1 · Paso 2 Decisor',
    s3:'Módulo 1 · Paso 3 Meta', s4:'Módulo 1 · Paso 4 Herramientas', s5:'Módulo 2 · Storytelling', s6:'Propuesta final' };
  return map[active.id] || active.id;
}

function collectData(){
  const country = COUNTRIES[ST.country], perfil = PERFILES.find(x=>x.id===ST.perfil), meta = METAS.find(x=>x.id===ST.meta);
  const gv = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  const gt = (id) => { const el = document.getElementById(id); return el ? el.innerText.trim() : ''; };
  return {
    equipo: TEAM_NAME,
    paso_actual: currentStepLabel(),
    pais: country ? country.name : '',
    decisor: perfil ? perfil.title : '',
    meta: meta ? meta.title : '',
    apertura: BUILDER_SEL.apertura || '',
    presion: BUILDER_SEL.presion || '',
    relacion: BUILDER_SEL.relacion || '',
    objecion: BUILDER_SEL.objecion || '',
    descripcion_decisor: gt('descOut'),
    dato_tipo: BUILDER2_SEL.tipo || '',
    dato_fuente: BUILDER2_SEL.fuente || '',
    dato_valor: gv('ta-p2-valor'),
    dato_adicional_texto: gt('descOut2'),
    herramienta_activa: COMBO_TOOLS.length ? COMBO_TOOLS.map(k=>TOOLS[k].nombre).join(' + ') : '',
    escenario: gv('ta-escenario'),
    desarrollo: gv('ta-desarrollo'),
    acciones_corto_plazo: gv('ta-cp'),
    acciones_largo_plazo: gv('ta-lp'),
    metricas: gv('ta-metricas'),
    reto: gv('ta-reto'),
    solucion: gv('ta-sol'),
    resultados_esperados: gv('ta-res'),
    listo_para_presentar: document.getElementById('s6') && document.getElementById('s6').classList.contains('on') ? 'SI' : 'NO',
  };
}

/* — Capa 1: respaldo local ————————————————————————— */

function saveLocal(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ts: Date.now(),
      team: TEAM_NAME,
      st: ST,
      combo: COMBO_TOOLS,
      builder: BUILDER_SEL,
      builder2: BUILDER2_SEL,
      screen: (document.querySelector('.screen.on')||{}).id || 's0',
      fields: Object.fromEntries(
        Array.from(document.querySelectorAll('textarea[id], input[id]')).map(el=>[el.id, el.value])
      ),
    }));
    return true;
  }catch(e){ return false; } // modo privado o cuota llena: no es un error fatal
}

function readLocal(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}

function clearLocal(){
  try{ localStorage.removeItem(STORAGE_KEY); }catch(e){}
}

/* — Capa 2: Google Sheet vía función serverless ——————— */

function saveToSheet(){
  saveLocal();
  if(!TEAM_NAME) return;                 // sin nombre de equipo no hay fila que actualizar
  if(remoteSaveDisabled){ setSaveIndicator('local'); return; }

  setSaveIndicator('saving');
  fetch(SAVE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(collectData()),
  }).then(r=>{
    if(r.status === 501){                // el Sheet no está configurado en este despliegue
      remoteSaveDisabled = true;
      setSaveIndicator('local');
      return;
    }
    setSaveIndicator(r.ok ? 'saved' : 'error');
  }).catch(()=> setSaveIndicator('error'));
}

function saveDebounced(){
  clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(saveToSheet, SAVE_DEBOUNCE_MS);
}

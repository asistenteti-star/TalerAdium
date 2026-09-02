/* ═══ ARRANQUE Y CICLO DE VIDA ═══ */

function confirmTeam(){
  const val = document.getElementById('teamNameInput').value.trim();
  if(!val) return;
  TEAM_NAME = val;
  showScreen_('s1');
  document.getElementById('progBar').style.width = '0%';
  saveToSheet();
}

function showScreen_(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));
  document.getElementById(id).classList.add('on');
}

/* Borra todo — estado, textos escritos y respaldo local — y vuelve al inicio.
   Se confirma porque el equipo puede llevar 40 minutos de trabajo encima. */
function restart(){
  if(!confirm('Esto borra todo el trabajo de este equipo y empieza un caso nuevo. ¿Continuar?')) return;
  resetState();
  clearLocal();
  document.querySelectorAll('textarea, input[type="text"]').forEach(el=>{ el.value=''; });
  document.querySelectorAll('.c-btn,.p-card,.m-card,.chip-opt').forEach(el=>{
    el.classList.remove('sel');
    if(el.hasAttribute('aria-pressed')) el.setAttribute('aria-pressed','false');
    if(el.hasAttribute('aria-checked')) el.setAttribute('aria-checked','false');
  });
  document.getElementById('ctxPanel').classList.remove('on');
  document.getElementById('ctxPanel').innerHTML='';
  ['btn1','btn2','btn3'].forEach(id=>document.getElementById(id).disabled=true);
  document.getElementById('btnTeam').disabled = true;
  setSaveIndicator('');
  showScreen_('s0');
  document.getElementById('progBar').style.width='0%';
  window.scrollTo({top:0,behavior:'smooth'});
}

/* ═══ REANUDAR SESIÓN ═══
   Si el navegador tiene un respaldo de menos de 12 horas, se ofrece
   continuar en lugar de empezar de cero. Solo se restauran país, decisor
   y meta más los textos; las pantallas se vuelven a renderizar desde el
   estado, no se guarda HTML. */
const RESUME_WINDOW_MS = 12 * 60 * 60 * 1000;

function offerResume(){
  const saved = readLocal();
  if(!saved || !saved.team) return;
  if(Date.now() - (saved.ts||0) > RESUME_WINDOW_MS){ clearLocal(); return; }

  const bar = document.getElementById('resumeBar');
  if(!bar) return;
  document.getElementById('resumeTeam').textContent = saved.team;
  bar.hidden = false;
  document.getElementById('btnResume').onclick = ()=> applyResume(saved);
  document.getElementById('btnDiscard').onclick = ()=>{ clearLocal(); bar.hidden = true; };
}

function applyResume(saved){
  TEAM_NAME = saved.team;
  ST = Object.assign({country:null,perfil:null,meta:null}, saved.st||{});
  COMBO_TOOLS = Array.isArray(saved.combo) ? saved.combo : [];
  BUILDER_SEL = saved.builder || {};
  BUILDER2_SEL = saved.builder2 || {};
  document.getElementById('resumeBar').hidden = true;
  document.getElementById('teamNameInput').value = TEAM_NAME;

  // Reconstruye la selección visual del Módulo 1
  if(ST.country){
    const idx = Object.keys(COUNTRIES).indexOf(ST.country);
    const el = document.querySelectorAll('.c-btn')[idx];
    if(el){ markPressed_('.c-btn', el); renderCtx(ST.country); document.getElementById('btn1').disabled=false; }
  }
  if(ST.perfil){
    const el = document.querySelectorAll('.p-card')[PERFILES.findIndex(p=>p.id===ST.perfil)];
    if(el){ markPressed_('.p-card', el); document.getElementById('btn2').disabled=false; }
  }
  if(ST.meta){
    const el = document.querySelectorAll('.m-card')[METAS.findIndex(m=>m.id===ST.meta)];
    if(el){ markPressed_('.m-card', el); document.getElementById('btn3').disabled=false; }
  }

  const target = saved.screen || 's1';
  if(target === 's5' || target === 's6'){
    // startM2() reinicia BUILDER_SEL y BUILDER2_SEL como parte de armar el
    // módulo desde cero, así que las selecciones se reponen DESPUÉS de él.
    const chips  = BUILDER_SEL;
    const chips2 = BUILDER2_SEL;
    startM2();                                  // reconstruye todo el Módulo 2
    BUILDER_SEL  = chips;
    BUILDER2_SEL = chips2;
    restoreFields_(saved.fields);               // …y luego repone los textos
    restoreChips_();
    if(target === 's6') buildProposal();
  }else{
    restoreFields_(saved.fields);
    go(Number(target.replace('s','')) || 1);
  }
  setSaveIndicator('local');
}

function restoreFields_(fields){
  if(!fields) return;
  Object.entries(fields).forEach(([id,v])=>{
    const el = document.getElementById(id);
    if(el && v) el.value = v;
  });
}

/* Vuelve a marcar los chips elegidos y regenera los textos derivados. */
function restoreChips_(){
  Object.entries(BUILDER_SEL).forEach(([dim,v])=>{
    const el = document.querySelector(`.chip-opt[data-dim="${dim}"][data-val="${v}"]`);
    if(el) markChip_(`.chip-opt[data-dim="${dim}"]`, el);
  });
  Object.entries(BUILDER2_SEL).forEach(([dim,v])=>{
    const el = document.querySelector(`.chip-opt[data-dim2="${dim}"][data-val="${v}"]`);
    if(el) markChip_(`.chip-opt[data-dim2="${dim}"]`, el);
  });
  updateDescOut();
  updateDescOut2();
}

/* ═══ LISTENERS ═══ */

document.addEventListener('input', function(e){
  if(e.target && e.target.tagName === 'TEXTAREA') saveDebounced();
});

document.getElementById('teamNameInput').addEventListener('input', function(){
  document.getElementById('btnTeam').disabled = !this.value.trim();
});

document.getElementById('teamNameInput').addEventListener('keydown', function(e){
  if(e.key === 'Enter' && this.value.trim()) confirmTeam();
});

// Las pestañas del encabezado navegan entre módulos si ya hay datos suficientes
document.getElementById('tab1').addEventListener('click', ()=>{
  if(ST.country) go(4); else if(TEAM_NAME) go(1);
});
document.getElementById('tab2').addEventListener('click', ()=>{
  if(ST.country && ST.perfil && ST.meta) startM2();
});

init();
offerResume();

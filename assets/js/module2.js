/* ═══ MÓDULO 2 · STORYTELLING · contexto, datos y narrativa ═══ */


function startM2(){
  const country=COUNTRIES[ST.country];
  const perfil=PERFILES.find(x=>x.id===ST.perfil);
  const meta=METAS.find(x=>x.id===ST.meta);
  if(!country||!perfil||!meta) return;

  document.getElementById('p1-quien').innerHTML=icon(perfil.ic)+' '+perfil.title;
  document.getElementById('p1-quien-detail').textContent=country.name+' · '+country.hta;
  document.getElementById('p1-objetivo').textContent=meta.title;
  document.getElementById('p1-objetivo-detail').textContent=meta.tag;

  // Las cinco publicaciones principales, como enlaces y sin cifras: la idea
  // es que el equipo vaya a la fuente y no a un número ya resumido.
  document.getElementById('vizGrid').innerHTML = TOP5_PAPERS.map(k=>{
    const e = EVREF[k];
    if(!e) return '';
    return `<a class="paper-card" href="${e.url}" target="_blank" rel="noopener">
      <span class="paper-card-name">${e.paper}</span>
      <span class="paper-card-cta">Abrir la publicación ${icon('external')}</span>
    </a>`;
  }).join('');

  const guia=(items)=>`<ul class="guia-list">${items.map(t=>`<li>${t}</li>`).join('')}</ul>`;
  document.getElementById('escenario-content').innerHTML=`<div class="story3-item-lbl" style="margin-bottom:.5rem">QUÉ INCLUIR</div>`+guia([
    '¿Cuándo y dónde tiene lugar la historia?',
    '¿Quiénes son los protagonistas?',
    'La situación: el problema y la posible mejora.',
    '¿Qué necesitamos hacer para resolver la situación?']);
  const base=TOOLS_BY_META[ST.meta]||[];
  const evKeys=[...new Set(base.flatMap(k=>TOOLS[k].ev))];
  const evh=bloqueEvidencia(evKeys, 'Datos disponibles para sustentar el desarrollo', 'Ver la publicación');
  document.getElementById('desarrollo-content').innerHTML=`<div class="story3-item-lbl" style="margin-bottom:.5rem">QUÉ INCLUIR</div>`+guia([
    'Da ejemplos que ilustren la situación.',
    'Incluye datos que muestren el reto o la solución.',
    'Explica lo que sucederá si no se toman medidas.',
    'Discute las posibles opciones para abordar la situación.',
    'Ilustra los beneficios de la solución.'])+evh;

  const hint=(t)=>`<p class="conc-hint">${t}</p>`;
  document.getElementById('acciones-cp').innerHTML=hint('Acciones concretas hasta tres meses.')+`<textarea style="margin-top:.6rem;min-height:110px" id="ta-cp" placeholder="Escribe aquí las acciones a corto plazo..."></textarea>`;
  document.getElementById('acciones-lp').innerHTML=hint('Acciones concretas más allá de tres meses, dentro del plan a 12 meses.')+`<textarea style="margin-top:.6rem;min-height:110px" id="ta-lp" placeholder="Escribe aquí las acciones a largo plazo..."></textarea>`;
  document.getElementById('resumen-final').innerHTML=`
    <div><div class="resumen-item-lbl">EL RETO</div><textarea id="ta-reto" style="min-height:80px" placeholder="En una frase..."></textarea></div>
    <div><div class="resumen-item-lbl">LA SOLUCIÓN</div><textarea id="ta-sol" style="min-height:80px" placeholder="En una frase..."></textarea></div>
    <div><div class="resumen-item-lbl">RESULTADOS ESPERADOS</div><textarea id="ta-res" style="min-height:80px" placeholder="En una frase..."></textarea></div>`;

  BUILDER_SEL = {};
  BUILDER2_SEL = {};
  renderChipBuilder();
  renderChipBuilder2();
  renderSuggestions();
  document.getElementById('cr5').innerHTML=document.getElementById('cr4').innerHTML;
  showStep(1,document.querySelectorAll('.step-tab')[0]);
  go(5);
}

function renderChipBuilder(){
  const box = document.getElementById('chipBuilder');
  if(!box) return;
  box.innerHTML = BUILDER_DIMS.map(dim => `
    <div class="chip-row">
      <div class="chip-row-lbl">${dim.label}</div>
      <div class="chip-opts" role="radiogroup" aria-label="${dim.label}">
        ${dim.opts.map(o => `<div class="chip-opt" role="radio" tabindex="0" aria-checked="false" data-dim="${dim.id}" data-val="${o.v}" onclick="pickChip('${dim.id}','${o.v}',this)" onkeydown="chipKey_(event,this)">${o.t}</div>`).join('')}
      </div>
    </div>`).join('');
  updateDescOut();
}

function chipKey_(e, el){
  if(e.key==='Enter' || e.key===' '){ e.preventDefault(); el.click(); }
}

function markChip_(selector, el){
  document.querySelectorAll(selector).forEach(c=>{ c.classList.remove('sel'); c.setAttribute('aria-checked','false'); });
  el.classList.add('sel');
  el.setAttribute('aria-checked','true');
}

function pickChip(dimId, val, el){
  markChip_(`.chip-opt[data-dim="${dimId}"]`, el);
  BUILDER_SEL[dimId] = val;
  updateDescOut();
  saveDebounced();
}

function updateDescOut(){
  const out = document.getElementById('descOut');
  if(!out) return;
  const country = COUNTRIES[ST.country], perfil = PERFILES.find(x=>x.id===ST.perfil), meta = METAS.find(x=>x.id===ST.meta);
  if(!country||!perfil||!meta){ out.textContent = 'Completa el Módulo 1 primero.'; out.dataset.vacio='1'; return; }

  const frases = BUILDER_DIMS.map(dim => {
    const sel = BUILDER_SEL[dim.id];
    if(!sel) return null;
    const opt = dim.opts.find(o=>o.v===sel);
    return opt ? opt.frase : null;
  }).filter(Boolean);

  if(frases.length === 0){
    out.innerHTML = `Interlocutor: <strong>${perfil.title}</strong> en <strong>${country.name}</strong>. Objetivo de la conversación: <em>${meta.title.toLowerCase()}</em>. Selecciona las opciones de arriba para enriquecer esta descripción.`;
    out.dataset.vacio='1';
    return;
  }

  // Las frases de la primera dimensión están redactadas en minúscula, para
  // continuar una oración; las demás empiezan en mayúscula. Al unirlas todas
  // con punto quedaban frases como "(IETS). no tiene una postura definida",
  // así que la inicial se ajusta al unirlas.
  const mayus = (f) => f.charAt(0).toUpperCase() + f.slice(1);
  let texto = `Este interlocutor es un <strong>${perfil.title.toLowerCase()}</strong> en <strong>${country.name}</strong>, donde la evaluación de tecnologías está a cargo de ${country.hta}. `;
  texto += frases.map(mayus).join('. ') + '. ';
  texto += `El objetivo de esta conversación es <em>${meta.title.toLowerCase()}</em>.`;
  out.innerHTML = texto;
  delete out.dataset.vacio;
}

function renderChipBuilder2(){
  const box = document.getElementById('chipBuilder2');
  if(!box) return;
  box.innerHTML = BUILDER2_DIMS.map(dim => `
    <div class="chip-row">
      <div class="chip-row-lbl">${dim.label}</div>
      <div class="chip-opts" role="radiogroup" aria-label="${dim.label}">
        ${dim.opts.map(o => `<div class="chip-opt" role="radio" tabindex="0" aria-checked="false" data-dim2="${dim.id}" data-val="${o.v}" onclick="pickChip2('${dim.id}','${o.v}',this)" onkeydown="chipKey_(event,this)">${o.t}</div>`).join('')}
      </div>
    </div>`).join('');
  updateDescOut2();
}
function pickChip2(dimId, val, el){
  markChip_(`.chip-opt[data-dim2="${dimId}"]`, el);
  BUILDER2_SEL[dimId] = val;
  updateDescOut2();
  saveDebounced();
}
function updateDescOut2(){
  const out = document.getElementById('descOut2');
  if(!out) return;
  const frases = BUILDER2_DIMS.map(dim=>{
    const sel = BUILDER2_SEL[dim.id];
    if(!sel) return null;
    const opt = dim.opts.find(o=>o.v===sel);
    return opt ? opt.frase : null;
  }).filter(Boolean);
  const valor = (document.getElementById('ta-p2-valor')||{}).value?.trim() || '';
  if(!frases.length && !valor){
    out.textContent = 'Selecciona las opciones de arriba para generar el texto.';
    out.dataset.vacio = '1';
    return;
  }
  delete out.dataset.vacio;
  let texto = frases.length ? `El equipo aporta ${frases.join(', ')}.` : 'Dato adicional aportado por el equipo.';
  if(valor) texto += ` Hallazgo específico: <strong>${valor}</strong>.`;
  out.innerHTML = texto;
}

function insertSuggestion(taId, text){
  const ta = document.getElementById(taId);
  if(!ta) return;
  // Cada frase ocupa su propio renglón, así que empieza una oración y no
  // continúa la anterior: la inicial se pone en mayúscula.
  const frase = text.trim().charAt(0).toUpperCase() + text.trim().slice(1);
  ta.value = ta.value.trim() ? (ta.value.trim() + '\n' + frase) : frase;
  ta.focus();
  saveDebounced();
}
function renderSuggestions(){
  const country=COUNTRIES[ST.country], perfil=PERFILES.find(x=>x.id===ST.perfil), meta=METAS.find(x=>x.id===ST.meta);
  if(!country||!perfil||!meta) return;

  // Cada frase se inserta en su propio renglón, así que tiene que sostenerse
  // sola. Antes eran fragmentos pensados para encadenarse en una sola oración
  // y quedaban líneas huérfanas: una terminaba en coma y la siguiente
  // arrancaba en mayúscula sin continuarla.
  const escSugs = [
    `La conversación ocurre en una reunión con ${perfil.title.toLowerCase()} de ${country.name}.`,
    `El objetivo es ${meta.title.toLowerCase()}.`,
    `Estamos en un escenario de ${meta.tag.toLowerCase().replace(' · ', ', con ')}.`,
    `El protagonista es el paciente con osteoartrosis de rodilla que hoy espera una alternativa en este sistema.`,
    `Hoy, sin una alternativa clara, el sistema asume el costo de no actuar a tiempo.`,
  ];
  const suggEsc = document.getElementById('suggEscenario');
  if(suggEsc){
    suggEsc.innerHTML = escSugs.map(t=>`<div class="sugg-chip" onclick="insertSuggestion('ta-escenario', this.textContent)">${t}</div>`).join('');
  }

  const base = TOOLS_BY_META[ST.meta]||[];
  const evKeys = [...new Set(base.flatMap(k=>TOOLS[k].ev))];
  const desSugs = evKeys.map(k=>{
    const e = EVREF[k];
    return `Según ${e.paper}: ${e.result}.`;
  });
  desSugs.push('Si no se actúa, el sistema asumirá un costo mayor en el mediano plazo.');
  desSugs.push('La opción que proponemos es incorporar Suprahyal con el respaldo de esta evidencia.');
  const suggDes = document.getElementById('suggDesarrollo');
  if(suggDes){
    suggDes.innerHTML = desSugs.map(t=>`<div class="sugg-chip" onclick="insertSuggestion('ta-desarrollo', this.textContent)">${t}</div>`).join('');
  }
}

function showStep(n, tabEl){
  const tabs = document.querySelectorAll('.step-tab');
  tabs.forEach(t=>{ t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
  const active = tabEl || tabs[n-1];
  if(active){ active.classList.add('active'); active.setAttribute('aria-selected','true'); }
  document.querySelectorAll('.step-content').forEach(c=>c.classList.remove('on'));
  document.getElementById('step'+n).classList.add('on');
  window.scrollTo({top:0,behavior:'smooth'});
}

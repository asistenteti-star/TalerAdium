/* ═══ MÓDULO 2 · STORYTELLING — contexto, datos y narrativa ═══ */

/* PENDIENTE DE DECISIÓN — ver docs/ROADMAP.md, punto 1.
   getStory() no se invoca en ninguna parte de la app: todo el contenido de
   STORY (guiones de escenario, acciones y resumen por perfil×meta) está en el
   archivo pero nunca llega a la pantalla. Se conserva intacto a la espera de
   definir si se muestra como guion sugerido en el Paso 3 o se retira.
   Además, solo 5 de las 24 combinaciones tienen guion propio; el resto caería
   en el genérico fin×presup, que hablaría de un director financiero incluso a
   un equipo que eligió clínico prescriptor. */
function getStory(){
  return STORY[ST.perfil]?.[ST.meta] || STORY.fin.presup;
}

/* Devuelve true solo si la combinación elegida tiene guion propio. */
function tieneGuionPropio(){
  return Boolean(STORY[ST.perfil] && STORY[ST.perfil][ST.meta]);
}

function getViz(){return VIZ[ST.meta]||VIZ.presup}

function startM2(){
  const country=COUNTRIES[ST.country];
  const perfil=PERFILES.find(x=>x.id===ST.perfil);
  const meta=METAS.find(x=>x.id===ST.meta);
  if(!country||!perfil||!meta) return;
  const viz=getViz();

  document.getElementById('p1-quien').textContent=perfil.icon+' '+perfil.title;
  document.getElementById('p1-quien-detail').textContent=country.flag+' '+country.name+' · '+country.hta;
  document.getElementById('p1-objetivo').textContent=meta.title;
  document.getElementById('p1-objetivo-detail').textContent=meta.tag;

  document.getElementById('vizGrid').innerHTML=viz.map(v=>{
    let barHtml='';
    if(v.bar){barHtml=`<div class="viz-bar-wrap">${v.bar.labels.map((l,i)=>`<div class="viz-bar-label"><span>${l}</span><span style="color:var(--white);font-weight:600">${v.bar.vals[i]}</span></div><div class="viz-bar-bg"><div class="viz-bar-fill" style="width:${v.bar.vals[i]/v.bar.max*100}%;background:${i===0?'#c47f00':'var(--teal)'}"></div></div>`).join('')}</div>`;}
    return `<div class="viz-card"><div class="viz-title">${v.title}</div><div class="viz-stat"><div class="viz-num">${v.num}</div><div class="viz-unit">${v.unit}</div></div><div class="viz-desc">${v.desc}</div>${barHtml}<div class="viz-source">Fuente: ${v.src}</div></div>`;
  }).join('');

  const guia=(items)=>items.map(t=>`<div class="story3-item"><div class="story3-item-val" style="color:var(--gray)">• ${t}</div></div>`).join('');
  document.getElementById('escenario-content').innerHTML=`<div class="story3-item-lbl" style="margin-bottom:.5rem">QUÉ INCLUIR</div>`+guia([
    '¿Cuándo y dónde tiene lugar la historia?',
    '¿Quiénes son los protagonistas?',
    'La situación: el problema y la posible mejora.',
    '¿Qué necesitamos hacer para resolver la situación?']);
  const base=TOOLS_BY_META[ST.meta]||[];
  const evKeys=[...new Set(base.flatMap(k=>TOOLS[k].ev))];
  const evh=evKeys.map(e=>EVREF[e]).map(e=>`<div class="ev-item"><div class="ev-dot"></div><div><div class="ev-paper">${e.paper}</div><div class="ev-result">${e.result}</div><a href="${e.url}" target="_blank" rel="noopener" style="font-size:0.72rem;color:var(--teal);text-decoration:none">↗ Ver paper</a></div></div>`).join('');
  document.getElementById('desarrollo-content').innerHTML=`<div class="story3-item-lbl" style="margin-bottom:.5rem">QUÉ INCLUIR</div>`+guia([
    'Da ejemplos que ilustren la situación.',
    'Incluye datos que muestren el reto o la solución.',
    'Explica lo que sucederá si no se toman medidas.',
    'Discute las posibles opciones para abordar la situación.',
    'Ilustra los beneficios de la solución.'])+`<div class="ev-block" style="margin-top:.9rem;margin-bottom:0"><div class="ev-lbl">Datos disponibles para sustentar el desarrollo</div>${evh}</div>`;

  const hint=(t)=>`<div class="conc-item"><div class="conc-dot" style="background:var(--gray-d)"></div><div style="color:var(--gray)">${t}</div></div>`;
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
  if(!country||!perfil||!meta){ out.textContent = 'Completa el Módulo 1 primero.'; return; }

  const frases = BUILDER_DIMS.map(dim => {
    const sel = BUILDER_SEL[dim.id];
    if(!sel) return null;
    const opt = dim.opts.find(o=>o.v===sel);
    return opt ? opt.frase : null;
  }).filter(Boolean);

  if(frases.length === 0){
    out.innerHTML = `Interlocutor: <strong>${perfil.title}</strong> en <strong>${country.name}</strong>. Objetivo de la conversación: <em>${meta.title.toLowerCase()}</em>. Selecciona las opciones de arriba para enriquecer esta descripción.`;
    return;
  }

  let texto = `Este interlocutor es un <strong>${perfil.title.toLowerCase()}</strong> en <strong>${country.name}</strong> (${country.hta}). `;
  texto += frases.join('. ') + '. ';
  texto += `El objetivo de esta conversación es <em>${meta.title.toLowerCase()}</em>.`;
  out.innerHTML = texto;
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
  if(frases.length===0 && !valor){ out.textContent = 'Selecciona las opciones de arriba para generar el texto.'; return; }
  let texto = frases.length ? `Se incorpora ${frases.join(', ')}.` : 'Dato adicional aportado por el equipo.';
  if(valor) texto += ` Hallazgo específico: <strong>${valor}</strong>.`;
  out.innerHTML = texto;
}

function insertSuggestion(taId, text){
  const ta = document.getElementById(taId);
  if(!ta) return;
  ta.value = ta.value.trim() ? (ta.value.trim() + ' ' + text) : text;
  ta.focus();
}
function renderSuggestions(){
  const country=COUNTRIES[ST.country], perfil=PERFILES.find(x=>x.id===ST.perfil), meta=METAS.find(x=>x.id===ST.meta);
  if(!country||!perfil||!meta) return;

  const escSugs = [
    `En una reunión con ${perfil.title.toLowerCase()} de ${country.name},`,
    `el reto que enfrentamos es ${meta.tag.toLowerCase()}.`,
    `El paciente típico con osteoartrosis de rodilla en este sistema`,
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
    return `Según ${e.paper}, ${e.result.toLowerCase()}.`;
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

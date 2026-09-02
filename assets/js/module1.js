/* ═══ MÓDULO 1 · SEGMENTACIÓN — país, decisor, meta y herramientas ═══ */

/* Las tarjetas de selección son <div>, no <button>, para conservar el diseño.
   makeSelectable_ les devuelve el comportamiento de un botón real: foco,
   Enter/Espacio y semántica anunciable por lector de pantalla. */
function makeSelectable_(el, label, handler){
  el.setAttribute('role','button');
  el.setAttribute('tabindex','0');
  el.setAttribute('aria-pressed','false');
  el.setAttribute('aria-label', label);
  el.onclick = handler;
  el.onkeydown = e => {
    if(e.key==='Enter' || e.key===' '){ e.preventDefault(); handler(); }
  };
  return el;
}

function markPressed_(selector, el){
  document.querySelectorAll(selector).forEach(x=>{
    x.classList.remove('sel');
    x.setAttribute('aria-pressed','false');
  });
  el.classList.add('sel');
  el.setAttribute('aria-pressed','true');
}

function init(){
  const cg=document.getElementById('countryGrid');
  cg.innerHTML='';
  Object.entries(COUNTRIES).forEach(([id,c])=>{
    const el=document.createElement('div');
    el.className='c-btn';
    el.innerHTML=`<div class="c-flag-big">${c.flagEmoji}</div><div class="c-name">${c.name}</div>`;
    makeSelectable_(el, 'Seleccionar '+c.name, ()=>pickCountry(id,el));
    cg.appendChild(el);
  });
  const pg=document.getElementById('perfilGrid');
  pg.innerHTML='';
  PERFILES.forEach(p=>{
    const el=document.createElement('div');
    el.className='p-card';
    el.innerHTML=`<div class="p-avatar" style="background:${p.color}22;border-color:${p.color}55;color:${p.color}"><span>${p.icon}</span></div><div class="p-title">${p.title}</div><div class="p-desc">${p.desc}</div><div class="p-kpi">Métricas: ${p.kpis.slice(0,3).join(' · ')}</div>`;
    makeSelectable_(el, 'Seleccionar decisor: '+p.title, ()=>pickPerfil(p.id,el));
    pg.appendChild(el);
  });
  const mg=document.getElementById('metaGrid');
  mg.innerHTML='';
  METAS.forEach(m=>{
    const el=document.createElement('div');
    el.className='m-card';
    el.innerHTML=`<div class="m-num">${m.num}</div><div class="m-title">${m.title}</div><div class="m-desc">${m.desc}</div><div class="m-tag">${m.tag}</div>`;
    makeSelectable_(el, m.num+': '+m.title, ()=>pickMeta(m.id,el));
    mg.appendChild(el);
  });
}

function go(n){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));
  document.getElementById('s'+n).classList.add('on');
  const pct=n<=4?(n-1)/3*100:100;
  document.getElementById('progBar').style.width=pct+'%';
  window.scrollTo({top:0,behavior:'smooth'});
  saveToSheet();
  if(n===2)renderCrumbs('cr2');
  if(n===3)renderCrumbs('cr3');
  if(n===4){renderCrumbs('cr4');renderResult();}
  // tabs
  document.getElementById('tab1').classList.toggle('active',n<=4);
  document.getElementById('tab2').classList.toggle('active',n>=5);
}

function renderCrumbs(id){
  const el=document.getElementById(id);
  let h='';
  if(ST.country)h+=`<div class="crumb on"><span class="crumb-lbl">País</span><span>${COUNTRIES[ST.country].flag} ${COUNTRIES[ST.country].name}</span></div>`;
  if(ST.perfil){const p=PERFILES.find(x=>x.id===ST.perfil);h+=`<div class="crumb on"><span class="crumb-lbl">Decisor</span><span>${p.icon} ${p.title}</span></div>`;}
  if(ST.meta){const m=METAS.find(x=>x.id===ST.meta);h+=`<div class="crumb on"><span class="crumb-lbl">Meta</span><span>${m.title}</span></div>`;}
  el.innerHTML=h;
}

function pickCountry(id,el){
  markPressed_('.c-btn', el);
  ST.country=id;
  renderCtx(id);document.getElementById('btn1').disabled=false;
  saveToSheet();
}
function ctxSec(label,text){
  if(!text) return '';
  return `<div class="ctx-sec"><div class="ctx-sec-lbl">${label}</div><div class="ctx-sec-val">${text}</div></div>`;
}
function findRefIndex_(refs, keywords){
  for(let i=0;i<refs.length;i++){
    const label = refs[i].label.toUpperCase();
    if(keywords.some(k=>label.includes(k.toUpperCase()))) return i+1;
  }
  return null;
}
function buildProse_(c){
  const gastoIdx = findRefIndex_(c.refs, ['OPS','PAHO']);
  const htaTokens = (c.hta.match(/[A-ZÁÉÍÓÚÑ]{2,}(-[A-Z]{2,})?/g) || []).filter(t=>t.length>1 && t!=='NOTA');
  let htaIdx = null;
  for(const tok of htaTokens){ htaIdx = findRefIndex_(c.refs, [tok]); if(htaIdx) break; }
  const coberturaIdx = findRefIndex_(c.refs, ['INEGI','MINSALUD','INEI','SUPERINTENDENCIA','INE ','INDEC','UCR','ENAHO','ENIGH','EPHC','CENSO','FONASA']);
  const sup = (n) => n ? `<sup><a href="#ref-${c.name}-${n}" style="color:var(--teal);text-decoration:none">${n}</a></sup>` : '';
  return `<p class="ctx-prose">${c.name} opera bajo el modelo de ${c.sistema}. El gasto de bolsillo representa ${c.gasto} del gasto total en salud${sup(gastoIdx)}, uno de los indicadores más directos de cuánto asumen los hogares frente a lo que cubre el sistema. La evaluación de tecnologías sanitarias está a cargo de ${c.hta}${sup(htaIdx)}. En materia de umbral de costo-efectividad, ${c.umbral.charAt(0).toLowerCase()+c.umbral.slice(1)} En cuanto a cobertura, ${c.cobertura}${sup(coberturaIdx)}</p>`;
}
function renderCtx(id){
  const c=COUNTRIES[id];
  const panel=document.getElementById('ctxPanel');
  const refs=c.refs.map((r,i)=>`<span id="ref-${c.name}-${i+1}"></span>[${i+1}] <a href="${r.url}" target="_blank">↗ ${r.label}</a>`).join('<br>');
  const robusto = c.estructura ? `
    ${ctxSec('Estructura del sistema', c.estructura)}
    ${ctxSec('Financiamiento', c.financiamiento)}
    ${ctxSec('Proceso de inclusión de tecnologías', c.inclusion)}
    ${ctxSec('Mecanismo de compra y pago', c.compra)}
    ${ctxSec('Vía alterna de acceso', c.alterno)}
    ${ctxSec('Contexto reciente', c.contexto)}
  ` : '';
  panel.innerHTML=`
    <div class="ctx-head"><div class="ctx-flag">${c.flag}</div><div><div class="ctx-title">${c.name}</div><span class="ctx-sub">${c.sistema}</span></div></div>
    ${buildProse_(c)}
    ${robusto}
    <div class="ctx-ref"><strong style="color:var(--gray)">Fuentes primarias verificadas:</strong><br>${refs}</div>`;
  panel.classList.add('on');
}
function pickPerfil(id,el){
  markPressed_('.p-card', el);
  ST.perfil=id;ST.meta=null;
  document.getElementById('btn2').disabled=false;
  saveToSheet();
}
function pickMeta(id,el){
  markPressed_('.m-card', el);
  ST.meta=id;
  document.getElementById('btn3').disabled=false;
  saveToSheet();
}


function renderResult(){
  const country=COUNTRIES[ST.country];
  const perfil=PERFILES.find(x=>x.id===ST.perfil);
  const meta=METAS.find(x=>x.id===ST.meta);
  if(!country||!perfil||!meta){document.getElementById('resBox').innerHTML='<p style="color:var(--gray)">Completa los tres pasos anteriores.</p>';return;}
  const base=TOOLS_BY_META[ST.meta]||[];
  COMBO_TOOLS = [...base];

  const metaMetricPills = (META_METRICS[ST.meta]||[]).map(k=>`<span class="kpi-pill">${k}</span>`).join('');
  const gapNote = `<div class="gap-note"><span class="gap-note-icon">Nota:</span><span class="gap-note-text">Toda esta evidencia proviene de Colombia y de consensos regionales. Si <strong>${country.name}</strong> aún no cuenta con un estudio propio —un CEA, un AIP o un análisis de carga de enfermedad con datos locales— esa brecha específica es, justamente, el tipo de proyecto que un equipo especializado en economía de la salud construye de la mano de un cliente.</span></div>`;

  document.getElementById('resBox').innerHTML=`
    <div class="res-wrap">
      <div class="res-hero">
        <div class="res-tag">${country.flag} ${country.name} · ${perfil.icon} ${perfil.title} · ${meta.num}</div>
        <div class="res-title">Arma tu combinación de herramientas</div>
        <div class="res-sub">${meta.title}. Ya precargamos las herramientas que aplican a tu meta. Toca o arrastra para quitar o agregar otras — el argumento de abajo se redacta solo con la evidencia de Suprahyal.</div>
      </div>
      <div class="res-body">
        <div class="drag-instructions"><span class="drag-instructions-icon">Instrucciones:</span><span><strong>Toca</strong> una tarjeta del <strong>catálogo completo</strong> para llevarla a <strong>tu combinación</strong>, y tócala de nuevo para devolverla. En computador también puedes arrastrarla entre las dos columnas.</span></div>

        <div class="drag-cols">
          <div class="drag-col">
            <div class="drag-col-lbl">Catálogo completo</div>
            <div class="drag-zone" id="dzCatalogo"></div>
          </div>
          <div class="drag-col">
            <div class="drag-col-lbl accent">Tu combinación</div>
            <div class="drag-zone accent" id="dzCombo"></div>
          </div>
        </div>

        <div class="arg-box">
          <div class="arg-lbl">Argumento generado con tu combinación</div>
          <p class="arg-text" id="argGenerado"></p>
        </div>

        <div id="comboDetails"></div>

        <div class="kpi-block"><div class="kpi-lbl">Métricas que mueven la decisión de este actor</div><div class="kpi-pills">${perfil.kpis.map(k=>`<span class="kpi-pill">${k}</span>`).join('')}</div></div>
        <div class="kpi-block" style="margin-top:0.9rem"><div class="kpi-lbl">Métricas sugeridas para esta meta de acceso</div><div class="kpi-pills">${metaMetricPills}</div></div>

        ${gapNote}
      </div>
    </div>`;

  renderDragZones();
  renderArgumento();
  renderComboDetails();
}

function makeDragCard_(k){
  const t = TOOLS[k];
  const el = document.createElement('div');
  el.className = 'drag-card';
  el.draggable = true;
  el.dataset.tool = k;
  el.innerHTML = `<span class="drag-card-icon">${t.icon}</span><span class="drag-card-name">${t.nombre}</span>`;
  el.setAttribute('role','button');
  el.setAttribute('tabindex','0');
  el.title = 'Toca o arrastra para mover esta herramienta';
  el.addEventListener('dragstart', e=>{ e.dataTransfer.setData('text/plain', k); });
  // En tablet y móvil el arrastre HTML5 no dispara: un toque mueve la tarjeta
  // a la otra columna. En escritorio conviven las dos formas.
  el.addEventListener('click', ()=> toggleTool_(k));
  el.addEventListener('keydown', e=>{
    if(e.key==='Enter' || e.key===' '){ e.preventDefault(); toggleTool_(k); }
  });
  return el;
}

/* Mueve una herramienta entre el catálogo y la combinación del equipo. */
function toggleTool_(k){
  COMBO_TOOLS = COMBO_TOOLS.includes(k) ? COMBO_TOOLS.filter(x=>x!==k) : [...COMBO_TOOLS, k];
  renderDragZones();
  renderArgumento();
  renderComboDetails();
  saveToSheet();
}

function renderDragZones(){
  const dzCat = document.getElementById('dzCatalogo');
  const dzCombo = document.getElementById('dzCombo');
  if(!dzCat || !dzCombo) return;
  dzCat.innerHTML = '';
  dzCombo.innerHTML = '';
  TOOL_ORDER.forEach(k=>{
    const card = makeDragCard_(k);
    card.setAttribute('aria-pressed', COMBO_TOOLS.includes(k) ? 'true' : 'false');
    if(COMBO_TOOLS.includes(k)) dzCombo.appendChild(card);
    else dzCat.appendChild(card);
  });
  [dzCat, dzCombo].forEach(zone=>{
    zone.ondragover = e => e.preventDefault();
    zone.ondrop = e => {
      e.preventDefault();
      const k = e.dataTransfer.getData('text/plain');
      const draggedCard = document.querySelector(`.drag-card[data-tool="${k}"]`);
      if(draggedCard) zone.appendChild(draggedCard);
      COMBO_TOOLS = Array.from(dzCombo.children).map(c=>c.dataset.tool);
      renderArgumento();
      renderComboDetails();
      saveToSheet();
    };
  });
}

function renderArgumento(){
  const out = document.getElementById('argGenerado');
  if(!out) return;
  const country=COUNTRIES[ST.country], perfil=PERFILES.find(x=>x.id===ST.perfil), meta=METAS.find(x=>x.id===ST.meta);
  if(COMBO_TOOLS.length===0){
    out.innerHTML = 'Arrastra al menos una herramienta a "Tu combinación" para generar el argumento.';
    return;
  }
  const fragmentos = COMBO_TOOLS.map(k=>{
    const t = TOOLS[k];
    const e = EVREF[t.ev[0]];
    return `${t.entrega} <span class="arg-cite">(${e.paper})</span>`;
  });
  let texto = `Para <strong>${perfil.title.toLowerCase()}</strong> en <strong>${country.name}</strong>, con el objetivo de <em>${meta.title.toLowerCase()}</em>, el argumento se construye así: ${fragmentos[0]}.`;
  for(let i=1;i<fragmentos.length;i++){
    texto += ` Además, ${fragmentos[i]}.`;
  }
  out.innerHTML = texto;
}

function renderComboDetails(){
  const box = document.getElementById('comboDetails');
  if(!box) return;
  if(COMBO_TOOLS.length===0){ box.innerHTML=''; return; }
  const base = TOOLS_BY_META[ST.meta]||[];
  box.innerHTML = COMBO_TOOLS.map(k=>{
    const t = TOOLS[k];
    const rank = base.includes(k) ? 'Aplica directamente a tu meta' : 'Agregada por el equipo';
    const evh = t.ev.map(e=>EVREF[e]).map(e=>`<div class="ev-item"><div class="ev-dot"></div><div><div class="ev-paper">${e.paper}</div><div class="ev-result">${e.result}</div><a href="${e.url}" target="_blank" style="font-size:0.68rem;color:var(--teal);text-decoration:none">↗ ${e.url}</a></div></div>`).join('');
    return `<div class="tool-card">
      <div class="tool-card-head"><span class="tool-card-icon">${t.icon}</span><div><div class="tool-card-rank">${rank}</div><div class="tool-card-name">${t.nombre}</div></div></div>
      <div class="tool-card-grid">
        <div><span class="res-item-lbl">Qué es</span><div class="res-item-val">${t.que}</div></div>
        <div><span class="res-item-lbl">Qué pregunta responde</span><div class="res-item-val">${t.pregunta}</div></div>
        <div><span class="res-item-lbl">Qué insumos requiere</span><div class="res-item-val">${t.insumos}</div></div>
        <div><span class="res-item-lbl">Qué entrega</span><div class="res-item-val">${t.entrega}</div></div>
      </div>
      <div class="ev-block" style="margin-bottom:0"><div class="ev-lbl">Evidencia de Suprahyal disponible</div>${evh}</div>
    </div>`;
  }).join('');
}

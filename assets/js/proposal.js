/* ═══ PROPUESTA FINAL · consolidado imprimible ═══ */

function val(id){const el=document.getElementById(id);return el&&el.value.trim()?el.value.trim():'';}

/* Texto generado por un constructor. Devuelve vacío mientras el bloque siga
   mostrando su texto de ayuda, para que el documento no lo cite como dato. */
function generado(id){
  const el = document.getElementById(id);
  if(!el || el.dataset.vacio) return '';
  return el.innerText.trim();
}
function fld(lbl,v){return `<div class="prop-field"><div class="prop-field-lbl">${lbl}</div><div class="prop-field-val ${v?'':'empty'}">${v||'Sin completar'}</div></div>`;}
function buildProposal(){
  const country=COUNTRIES[ST.country], perfil=PERFILES.find(x=>x.id===ST.perfil), meta=METAS.find(x=>x.id===ST.meta);
  if(!country||!perfil||!meta) return;
  const base=(typeof COMBO_TOOLS !== 'undefined' && COMBO_TOOLS.length) ? COMBO_TOOLS : (TOOLS_BY_META[ST.meta]||[]);
  const tools=base.map(k=>`<div class="prop-box"><div class="prop-tool-name">${icon(TOOLS[k].ic)}${sigla(TOOLS[k].icon)}<span>${TOOLS[k].nombre}</span></div><div class="prop-tool-desc">${TOOLS[k].entrega}</div></div>`).join('');
  const argGen = document.getElementById('argGenerado') ? document.getElementById('argGenerado').innerText.trim() : '';
  const evKeys=[...new Set(base.flatMap(k=>TOOLS[k].ev))];
  const evh=listaEvidencia(evKeys);
  const fecha=new Date().toLocaleDateString('es-CO',{day:'2-digit',month:'long',year:'numeric'});
  document.getElementById('propBox').innerHTML=`
  <div class="prop-wrap">
    <div class="prop-hero">
      <img class="prop-logo" src="assets/brand/alzak-claro.png" alt="ALZAK Consulting &amp; Research" width="360" height="128">
      <div class="prop-kicker">Propuesta del grupo de trabajo · ${fecha}</div>
      <div class="prop-title">${meta.title}</div>
      <div class="prop-lede">Plan de trabajo a 12 meses con Suprahyal ante ${perfil.title.toLowerCase()} · ${country.flagEmoji} ${country.name}</div>
      <div class="prop-meta">
        <span class="crumb on"><span class="crumb-lbl">Mercado</span><span>${country.flagEmoji} ${country.name}</span></span>
        <span class="crumb on"><span class="crumb-lbl">Decisor</span><span>${perfil.title}</span></span>
        <span class="crumb on"><span class="crumb-lbl">Meta</span><span>${meta.num}</span></span>
      </div>
    </div>

    <div class="prop-sec">
      <div class="prop-sec-num">01</div><div class="prop-sec-title">Comprensión del contexto</div>
      <div class="prop-2col">
        <div class="prop-box">${fld('A quién · audiencia', perfil.title+'\n'+country.name+' · '+country.hta)}</div>
        <div class="prop-box">${fld('Para qué · objetivo', meta.title+'\n'+meta.tag)}</div>
      </div>
      ${fld('Descripción general del decisor', generado('descOut'))}
      <div class="prop-box"><div class="prop-field-lbl">Contexto del sistema</div><div class="prop-field-val" style="font-size:0.8rem">Gasto de bolsillo ${country.gasto} · ${country.hta}<br>${country.cobertura}</div></div>
    </div>

    <div class="prop-sec">
      <div class="prop-sec-num">02</div><div class="prop-sec-title">Datos que sustentan la propuesta</div>
      <div class="ev-block"><div class="ev-lbl">Evidencia verificada de Suprahyal</div><ul class="ev-list">${evh}</ul></div>
      ${fld('Datos propios de nuestro mercado o cartera', generado('descOut2'))}
      <div class="prop-field-lbl" style="margin-top:.6rem">Herramientas de economía de la salud seleccionadas por el equipo</div>
      <div class="prop-2col" style="margin-top:.4rem">${tools}</div>
      ${fld('Argumento generado con esta combinación', argGen)}
    </div>

    <div class="prop-sec">
      <div class="prop-sec-num">03</div><div class="prop-sec-title">Storytelling</div>
      ${fld('Escenario de la historia', val('ta-escenario'))}
      ${fld('Desarrollo de la historia', val('ta-desarrollo'))}
    </div>

    <div class="prop-sec">
      <div class="prop-sec-num">04</div><div class="prop-sec-title">Conclusión · plan de trabajo a 12 meses</div>
      <div class="prop-2col" style="margin-bottom:1rem">
        <div class="prop-box">${fld('Acciones a corto plazo · hasta 3 meses', val('ta-cp'))}</div>
        <div class="prop-box">${fld('Acciones a largo plazo · más de 3 meses', val('ta-lp'))}</div>
      </div>
      ${fld('Métricas para validar los resultados', val('ta-metricas'))}
      <div class="prop-3col">
        <div class="prop-box">${fld('El reto', val('ta-reto'))}</div>
        <div class="prop-box">${fld('La solución', val('ta-sol'))}</div>
        <div class="prop-box">${fld('Resultados esperados', val('ta-res'))}</div>
      </div>
    </div>

    <div class="prop-pie">
      <p>&copy; ${new Date().getFullYear()} ALZAK Consulting &amp; Research · Taller de Farmacoeconomía Aplicada para Adium LATAM.
        Todos los derechos reservados.</p>
      <p>Documento de trabajo confidencial. Preparado por el equipo <strong>${TEAM_NAME || 'participante'}</strong> el ${fecha}.</p>
    </div>
  </div>`;
  saveToSheet();
  document.getElementById('cr6').innerHTML=document.getElementById('cr5').innerHTML;
  document.querySelectorAll('.screen').forEach(x=>x.classList.remove('on'));
  document.getElementById('s6').classList.add('on');
  document.getElementById('progBar').style.width='100%';
  window.scrollTo({top:0,behavior:'smooth'});
}

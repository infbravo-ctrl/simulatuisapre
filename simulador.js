/* ═══════════════════════════════════════════════════════════════════
   SimulaTuIsapre — SIMULADOR (un solo archivo para todo el sitio)
   Lo usan la portada (/) y Compara isapres (/comparar-isapres/).
   Lo que se arregla aquí queda arreglado en las dos páginas.
   Cada página solo pone marcadores donde va cada pieza:
     <div data-sti="ficha"></div>        → formulario de 4 pasos
     <div data-sti="resultados"></div>   → planes que calzan
     <div data-sti="asesoria"></div>     → pedir el informe gratis
   Requiere cargar antes /planes_data.js y /simulador.css.
   ═══════════════════════════════════════════════════════════════════ */

/* ── Piezas del simulador (HTML) ── */
const STI_PIEZAS = {
 "ficha": "<div class=\"ficha\" id=\"simulador\">\n    <div class=\"ficha-head\">\n      <div class=\"t\">Simulación de cotización</div>\n      <div class=\"folio\" id=\"folio\">FICHA Nº —</div>\n    </div>\n    <div class=\"pasos\" aria-hidden=\"true\">\n      <div class=\"paso-dot on\" data-p=\"1\"></div><div class=\"paso-dot\" data-p=\"2\"></div><div class=\"paso-dot\" data-p=\"3\"></div><div class=\"paso-dot\" data-p=\"4\"></div>\n    </div>\n\n    <!-- Paso 1: renta -->\n    <div class=\"ficha-body paso\" data-paso=\"1\">\n      <h2>¿Cuál es tu renta imponible?</h2>\n      <p class=\"ayuda\">Ingresa tu sueldo real antes de descuentos (el total imponible de tu liquidación). Así el cálculo de tu 7% es más exacto.</p>\n      <label class=\"campo\" for=\"renta\">Renta imponible mensual</label>\n      <div class=\"monto-input\"><span class=\"peso\">$</span><input type=\"text\" id=\"renta\" inputmode=\"numeric\" placeholder=\"1.200.000\" autocomplete=\"off\"></div>\n      <div class=\"calc-7\" id=\"calc7\">Tu 7% legal: <b>—</b></div>\n      <div class=\"nav-pasos\"><button class=\"btn btn-verde\" onclick=\"irPaso(2)\">Continuar →</button></div>\n      <p class=\"mini-nota\">No guardamos este dato: el cálculo ocurre en tu navegador.</p>\n    </div>\n\n    <!-- Paso 2: edad y cargas -->\n    <div class=\"ficha-body paso oculto\" data-paso=\"2\">\n      <h2>¿Quiénes entran al plan?</h2>\n      <p class=\"ayuda\">El precio depende de la edad de cada persona. <b>No te preguntamos tu sexo:</b> desde 2020 no influye en el precio.</p>\n      <label class=\"campo\" for=\"edadTit\">Tu edad</label>\n      <input type=\"text\" id=\"edadTit\" class=\"edad-input\" inputmode=\"numeric\" maxlength=\"2\" placeholder=\"Ej: 38\" autocomplete=\"off\">\n      <label class=\"campo\">Cargas <span class=\"opc\">(opcional: cónyuge, hijos u otras personas)</span></label>\n      <div class=\"cargas-lista\" id=\"cargasLista\"></div>\n      <button class=\"btn btn-fantasma\" type=\"button\" style=\"margin-top:10px\" onclick=\"agregarCarga()\">+ Agregar carga</button>\n      <p class=\"err\" id=\"err2\" role=\"alert\"></p>\n      <div class=\"nav-pasos\"><button class=\"btn btn-fantasma\" onclick=\"irPaso(1)\">← Volver</button><button class=\"btn btn-verde\" onclick=\"irPaso(3)\">Continuar →</button></div>\n    </div>\n\n    <!-- Paso 3: región -->\n    <div class=\"ficha-body paso oculto\" data-paso=\"3\">\n      <h2>¿En qué región vives?</h2>\n      <p class=\"ayuda\">Mostramos solo planes disponibles en tu región según lo declarado por cada isapre.</p>\n      <label class=\"campo\" for=\"region\">Región</label>\n      <select id=\"region\"></select>\n      <label class=\"campo\">Hoy estás en <span class=\"opc\">(opcional)</span></label>\n      <div class=\"chips\" id=\"prevision\">\n        <button type=\"button\" class=\"chip\" data-v=\"Fonasa\">Fonasa</button>\n        <button type=\"button\" class=\"chip\" data-v=\"Isapre\">Isapre</button>\n        <button type=\"button\" class=\"chip\" data-v=\"No sé\">No sé</button>\n      </div>\n      <div class=\"nav-pasos\"><button class=\"btn btn-fantasma\" onclick=\"irPaso(2)\">← Volver</button><button class=\"btn btn-verde\" onclick=\"irPaso(4)\">Continuar →</button></div>\n    </div>\n\n    <!-- Paso 4: prioridad -->\n    <div class=\"ficha-body paso oculto\" data-paso=\"4\">\n      <h2>¿Qué te importa más?</h2>\n      <p class=\"ayuda\">Con esto ordenamos los planes que calzan con tu presupuesto.</p>\n      <div class=\"chips\" id=\"prioridad\">\n        <button class=\"chip on\" data-v=\"hosp\">Mejor cobertura hospitalaria</button>\n        <button class=\"chip\" data-v=\"amb\">Mejor cobertura ambulatoria</button>\n        <button class=\"chip\" data-v=\"precio\">Pagar lo menos posible</button>\n        <button class=\"chip\" data-v=\"libre\">Libre elección de médicos</button>\n      </div>\n      <div class=\"nav-pasos\"><button class=\"btn btn-fantasma\" onclick=\"irPaso(3)\">← Volver</button><button class=\"btn btn-verde\" id=\"btnCalcular\" onclick=\"calcular()\">Ver mis planes →</button></div>\n      <p class=\"mini-nota\">Resultado inmediato. Sin correo, sin RUT, sin teléfono.</p>\n    </div>\n  </div>",
 "resultados": "<!-- Resultados -->\n<section id=\"resultados\" aria-live=\"polite\">\n  <div class=\"res-head\">\n    <h2>Tus mejores opciones</h2>\n    <p id=\"resSub\"></p>\n    <div class=\"res-meta\" id=\"resMeta\"></div>\n  </div>\n  <div class=\"tickets\" id=\"ticketsWrap\"></div>\n  <div class=\"ver-mas-wrap\"><button class=\"btn btn-fantasma\" id=\"verMas\" onclick=\"verMas()\">Ver más planes que calzan</button></div>\n</section>",
 "asesoria": "<section class=\"asesoria\" id=\"asesoria\">\n  <div class=\"asesoria-card\">\n    <div>\n      <h2>El simulador te muestra el mapa. Un asesor te evita las letras chicas.</h2>\n      <p>El precio es solo una parte: clínicas en convenio, carencias, topes por prestación y tu situación de salud cambian qué plan te conviene de verdad. Te contactamos por WhatsApp con un informe hecho a mano sobre tu caso.</p>\n      <ul>\n        <li>Asesoría gratuita y sin compromiso de contratar</li>\n        <li>Comparamos las 7 isapres, no trabajamos para ninguna</li>\n        <li>Te decimos también si te conviene quedarte donde estás</li>\n      </ul>\n    </div>\n    <form class=\"lead-form\" id=\"leadForm\" novalidate>\n      <h3>Recibe tu informe personalizado</h3>\n      <p class=\"sub-f\">Respondemos dentro del día hábil.</p>\n      <div class=\"sin-sim\" id=\"sinSim\">\n        <b>Primero haz tu simulación (1 minuto)</b>\n        Tu informe se prepara con tu renta, tus edades y el plan que elijas.\n        <button type=\"button\" class=\"btn-sim\" id=\"btnSimPrimero\">Simular ahora →</button>\n      </div>\n      <div id=\"leadCampos\" hidden>\n      <div class=\"plan-sel\" id=\"planSel\" hidden></div>\n      <label class=\"campo\" for=\"leadNombre\">Nombre</label>\n      <input type=\"text\" id=\"leadNombre\" autocomplete=\"name\" required>\n      <label class=\"campo\" for=\"leadFono\">WhatsApp</label>\n      <input type=\"tel\" id=\"leadFono\" inputmode=\"tel\" placeholder=\"+56 9 1234 5678\" autocomplete=\"tel\" required>\n      <label class=\"campo\" for=\"leadMail\">Correo (opcional)</label>\n      <input type=\"email\" id=\"leadMail\" autocomplete=\"email\">\n      <label class=\"campo\" for=\"leadClinica\">¿Tienes una clínica de preferencia? <span class=\"opc\">(opcional)</span></label>\n      <input type=\"text\" id=\"leadClinica\" list=\"listaClinicas\" autocomplete=\"off\" placeholder=\"Ej: Clínica Indisa\">\n      <datalist id=\"listaClinicas\"><option value=\"Clínica Alemana\"><option value=\"Clínica Las Condes\"><option value=\"Clínica Santa María\"><option value=\"Clínica Dávila\"><option value=\"Clínica Indisa\"><option value=\"RedSalud\"><option value=\"UC Christus\"><option value=\"Clínica Bupa Santiago\"><option value=\"Clínica Meds\"><option value=\"Clínica Tabancura\"><option value=\"Clínica Vespucio\"><option value=\"Integramédica\"></datalist>\n      <p class=\"ayuda-clinica\">La revisamos en el contrato del plan y en tu informe te decimos si este plan te conviene para atenderte ahí.</p>\n      <input type=\"text\" id=\"leadWeb\" class=\"hp\" tabindex=\"-1\" autocomplete=\"off\" aria-hidden=\"true\">\n      <div style=\"margin-top:16px\"><button type=\"submit\" class=\"btn btn-verde\">Quiero mi informe gratis</button></div>\n      <p class=\"priv\">Usamos tus datos solo para preparar tu informe y contactarte. Solo los compartiremos con un agente de ventas autorizado de la isapre que elijas si tú lo apruebas. Puedes pedir su eliminación cuando quieras. <a href=\"/privacidad.html\">Política de privacidad</a>.</p>\n      </div>\n    </form>\n    <div class=\"lead-form\" id=\"leadDone\" hidden>\n      <h3 id=\"doneTitulo\">¡Listo!</h3>\n      <p class=\"sub-f\">Este es el folio de tu solicitud:</p>\n      <div class=\"folio-box\" id=\"doneFolio\"></div>\n      <p class=\"done-txt\" id=\"doneCuando\"></p>\n      <button type=\"button\" class=\"btn btn-verde\" onclick=\"enviarWhatsApp()\">¿No se envió? Reintentar por WhatsApp</button>\n      <button type=\"button\" class=\"btn-link\" onclick=\"volverASimular()\">← Volver a simular</button>\n    </div>\n  </div>\n</section>",
 "cookies": "<div class=\"cookies\" id=\"avisoCookies\" hidden role=\"region\" aria-label=\"Aviso de cookies\">\n  <span>Usamos cookies para medir nuestros anuncios. <a href=\"/privacidad.html#cookies\">Más info</a></span>\n  <span><button type=\"button\" class=\"ck-no\" id=\"ckNo\">Rechazar</button> <button type=\"button\" class=\"ck-si\" id=\"ckSi\">Aceptar</button></span>\n</div>"
};
document.querySelectorAll('[data-sti]').forEach(el=>{ if(STI_PIEZAS[el.dataset.sti]) el.outerHTML = STI_PIEZAS[el.dataset.sti]; });
if(!document.getElementById('avisoCookies')) document.body.insertAdjacentHTML('beforeend', STI_PIEZAS.cookies);

/* ═══════════ CONFIGURACIÓN (edita esto) ═══════════ */
const CONFIG = {
  whatsapp: '56926485029',            // número de contacto para leads (editable cuando quieras)
  planillaUrl: 'https://script.google.com/macros/s/AKfycbyv1vZ50G99h6P3a2FfSap5G3fardmihDAujknDFUxMpAY5gTJyWJpmasytmPT6d9Vw/exec',                   // ← dirección de tu planilla (Apps Script, termina en /exec)
  metaPixelId: '1097095299905633',                   // ← ID del píxel de Meta; vacío = sin píxel ni aviso de cookies
  formspreeId: '',                    // ← opcional: ID de Formspree para respaldo por correo
  ufFallback: 40844.79            // UF Banco Central al 11-07-2026; solo se usa si ambas APIs fallan
};
/* ══════════════════════════════════════════════════ */

/* Tabla Única de Factores — Circular IF/N°343, Superintendencia de Salud */
const TFU = [
  {max:20, cot:0.6, car:0.6},
  {max:25, cot:0.9, car:0.7},
  {max:35, cot:1.0, car:0.7},
  {max:45, cot:1.3, car:0.9},
  {max:55, cot:1.4, car:1.0},
  {max:65, cot:2.0, car:1.4},
  {max:999,cot:2.4, car:2.2}
];
const TRAMOS = ['Menos de 20','20 a 24','25 a 34','35 a 44','45 a 54','55 a 64','65 o más'];
const REGIONES = [
  {i:15,n:'Arica y Parinacota'},{i:1,n:'Tarapacá'},{i:2,n:'Antofagasta'},{i:3,n:'Atacama'},
  {i:4,n:'Coquimbo'},{i:5,n:'Valparaíso'},{i:13,n:'Metropolitana'},{i:6,n:"O'Higgins"},
  {i:7,n:'Maule'},{i:16,n:'Ñuble'},{i:8,n:'Biobío'},{i:9,n:'Araucanía'},
  {i:14,n:'Los Ríos'},{i:10,n:'Los Lagos'},{i:11,n:'Aysén'},{i:12,n:'Magallanes'}
];

/* Prima GES por persona (UF/mes) — verificada por la Superintendencia de Salud, vigente desde enero 2026 (GES 90).
   Revisar cuando la Superintendencia publique nuevos valores. */
const GES = {'Banmédica':0.778,'Colmena':1.036,'Consalud':0.731,'Cruz Blanca':0.971,'Nueva Masvida':0.854,'Vida Tres':0.712,'Esencial':0.910};
/* Tope imponible para salud: 90 UF → cotización legal máxima 6,3 UF. Revisar cada año. */
const TOPE_IMPONIBLE_UF = 90;
const PRIO = {hosp:'Mejor cobertura hospitalaria', amb:'Mejor cobertura ambulatoria', precio:'Pagar lo menos posible', libre:'Libre elección de médicos'};

let UF = CONFIG.ufFallback, estado = {renta:0, edadTit:null, region:13, prio:'hosp', prevision:''}, mostrados = 3, ranking = [];

const $ = s => document.querySelector(s);
const fmt = n => '$' + Math.round(n).toLocaleString('es-CL');

/* Fecha y hora del día, en vivo (hora de Chile) */
const angosto = window.matchMedia('(max-width:520px)');
function tick(){
  const ahora = new Date(), corto = angosto.matches;
  const f = new Intl.DateTimeFormat('es-CL',{...(corto?{}:{weekday:'short'}),day:'numeric',month:'short',year:'numeric',timeZone:'America/Santiago'}).format(ahora);
  const h = new Intl.DateTimeFormat('es-CL',{hour:'2-digit',minute:'2-digit',...(corto?{}:{second:'2-digit'}),timeZone:'America/Santiago',hour12:false}).format(ahora);
  const el = $('#fechaHoy'); if(el) el.textContent = `${f} · ${h} h`;
}
tick(); setInterval(tick, 1000);

/* UF del día — doble fuente con respaldo */
function pintarUF(fecha){
  if($('#ufValor')) $('#ufValor').textContent = fmt(UF) + (fecha ? '' : ' (ref.)');
  if(fecha && $('#ufLabel')){ const [y,m,d] = fecha.split('-'); $('#ufLabel').textContent = `UF al ${d}-${m}-${y}`; }
  if($('#topeHoy')) $('#topeHoy').innerHTML = `${angosto.matches ? 'Tope' : 'Tope imponible'} ${TOPE_IMPONIBLE_UF} UF · <b>${fmt(TOPE_IMPONIBLE_UF*UF)}</b>`;
  document.dispatchEvent(new CustomEvent('sti-uf', {detail:UF}));  // otras partes de la página pueden usar la UF del día
  if(ranking.length) render();  // si ya había resultados, recalcula con la UF real
}
(async function cargarUF(){
  try{
    const d = await (await fetch('https://mindicador.cl/api/uf')).json();
    if(d?.serie?.[0]?.valor > 10000){ UF = d.serie[0].valor; pintarUF(d.serie[0].fecha.slice(0,10)); return; }
  }catch(e){}
  try{
    const d = await (await fetch('https://api.gael.cloud/general/public/monedas/UF')).json();
    const v = parseFloat(String(d.Valor).replace(/\./g,'').replace(',','.'));
    if(v > 10000){ UF = v; pintarUF(d.Fecha ? d.Fecha.slice(0,10) : null); return; }
  }catch(e){}
  pintarUF(null);
})();

/* Folio de la solicitud: STI-AAMM-XXXX. No revela cuántas solicitudes hay; es el mismo en la página, el WhatsApp y el informe. */
const FOLIO = (()=>{
  const d = new Date(), abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let r = ''; for(let i=0;i<4;i++) r += abc[Math.floor(Math.random()*abc.length)];
  return `STI-${String(d.getFullYear()).slice(2)}${String(d.getMonth()+1).padStart(2,'0')}-${r}`;
})();
$('#folio').textContent = 'FOLIO ' + FOLIO;

/* Nº de planes dinámico */
document.addEventListener('DOMContentLoaded', ()=>{
  const n = PLANES_DATA.planes.length.toLocaleString('es-CL');
  ['#nPlanes','#nPlanes2'].forEach(id=>{ if($(id)) $(id).textContent = n; });
  if(PLANES_DATA.total && $('#txtTotal')) $('#txtTotal').textContent = `De los ${PLANES_DATA.total.toLocaleString('es-CL')} planes registrados`;
  document.querySelectorAll('.periodo-dyn').forEach(el=>el.textContent = PLANES_DATA.periodo);
});

/* Renta con puntos de miles */
$('#renta').addEventListener('input', e=>{
  const v = e.target.value.replace(/\D/g,'');
  e.target.value = v ? Number(v).toLocaleString('es-CL') : '';
  estado.renta = Number(v)||0;
  $('#calc7').innerHTML = estado.renta
    ? `Tu 7% legal: <b>${fmt(siete())}</b> mensuales para salud` + (estado.renta > TOPE_IMPONIBLE_UF*UF ? ' (tope legal: 6,3 UF)' : '')
    : 'Tu 7% legal: <b>—</b>';
});

/* Edad: solo números */
const soloDigitos = el => el.addEventListener('input', ()=>{ el.value = el.value.replace(/\D/g,'').slice(0,2); $('#err2').textContent=''; });
soloDigitos($('#edadTit'));

/* Cargas: parentesco + edad */
function agregarCarga(){
  const row = document.createElement('div'); row.className='carga-row';
  const sel = document.createElement('select'); sel.setAttribute('aria-label','Parentesco de la carga');
  ['Cónyuge','Hijo/a','Otra carga'].forEach(t=>{ const o=document.createElement('option'); o.textContent=t; sel.appendChild(o); });
  const ed = document.createElement('input'); ed.type='text'; ed.inputMode='numeric'; ed.maxLength=2; ed.placeholder='Edad'; ed.setAttribute('aria-label','Edad de la carga');
  soloDigitos(ed);
  const del = document.createElement('button'); del.type='button'; del.textContent='×'; del.setAttribute('aria-label','Quitar carga');
  del.onclick = ()=> row.remove();
  row.append(sel, ed, del);
  $('#cargasLista').appendChild(row);
  if(document.querySelectorAll('#cargasLista .carga-row').length > 1) sel.selectedIndex = 1;  // desde la 2ª carga sugiere "Hijo o hija"
  ed.focus();
}

/* Regiones */
REGIONES.forEach(r=>{ const o=document.createElement('option'); o.value=r.i; o.textContent=r.n; if(r.i===13)o.selected=true; $('#region').appendChild(o); });

/* Selección de un solo chip (prioridad obligatoria; previsión opcional y se puede desmarcar) */
function chipsUnicos(id, clave, opcional){
  $(id).addEventListener('click', e=>{
    const b = e.target.closest('.chip'); if(!b) return;
    const yaEstaba = b.classList.contains('on');
    [...$(id).children].forEach(c=>c.classList.remove('on'));
    if(opcional && yaEstaba){ estado[clave] = ''; return; }
    b.classList.add('on'); estado[clave] = b.dataset.v;
  });
}
chipsUnicos('#prioridad','prio',false);
chipsUnicos('#prevision','prevision',true);
(()=>{ const p = new URLSearchParams(location.search).get('prioridad');
  if(['hosp','amb','precio','libre'].includes(p)) document.querySelector(`#prioridad .chip[data-v="${p}"]`).click(); })();

/* Tarjetas de prioridad fuera del simulador: eligen la prioridad y llevan al formulario */
function elegirPrioridad(p){
  const chip = document.querySelector(`#prioridad .chip[data-v="${p}"]`);
  if(chip && !chip.classList.contains('on')) chip.click();
  $('#simulador').scrollIntoView({behavior:'smooth', block:'start'});
  if(!estado.renta) setTimeout(()=>$('#renta').focus({preventScroll:true}), 450);
}
/* Si se llega con /#simulador, baja al formulario (se dibuja con este archivo) */
if(location.hash === '#simulador') window.addEventListener('load', ()=> $('#simulador').scrollIntoView());

/* De dónde viene el lead: la página donde lo pidió y cómo llegó al sitio (Google, anuncio, LinkedIn…) */
const ORIGEN = (()=>{
  const pag = location.pathname.replace(/index\.html$/,'');
  const pagina = pag === '/' ? 'Portada' : pag.includes('comparar-isapres') ? 'Comparar isapres' : pag;
  let llegada = '';
  try{ llegada = sessionStorage.getItem('sti_llegada') || ''; }catch(e){}
  if(!llegada){
    const q = new URLSearchParams(location.search);
    const utm = [q.get('utm_source'), q.get('utm_campaign')].filter(Boolean).join(' / ');
    let ref = ''; try{ ref = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./,'') : ''; }catch(e){}
    if(ref.endsWith('simulatuisapre.cl')) ref = '';
    llegada = utm ? 'campaña: ' + utm : ref ? 'desde ' + ref : 'directo';
    try{ sessionStorage.setItem('sti_llegada', llegada); }catch(e){}
  }
  return `${pagina} · ${llegada}`;
})();


/* Tabla de factores */
const tramoDe = e => TFU.findIndex(t => e < t.max);
const factorDe = (e, carga) => TFU[tramoDe(e)][carga ? 'car' : 'cot'];
const coma = n => n.toFixed(1).replace('.', ',');

/* Personas del plan: titular + cargas */
function grupo(){
  const g = [{rol:'Titular', edad:estado.edadTit, carga:false}];
  document.querySelectorAll('#cargasLista .carga-row').forEach(r=>{
    g.push({rol:r.querySelector('select').value, edad:parseInt(r.querySelector('input').value,10), carga:true});
  });
  g.forEach(p=>{ p.f = factorDe(p.edad, p.carga); });
  return g;
}
const factorGrupo = () => grupo().reduce((a,p)=>a+p.f, 0);
const siete = () => Math.min(estado.renta, TOPE_IMPONIBLE_UF*UF) * 0.07;

/* Navegación con validación */
function irPaso(n){
  if(n===2 && (!estado.renta || estado.renta < 100000)){ $('#renta').focus(); $('#calc7').innerHTML='Ingresa tu renta para continuar (mínimo $100.000)'; return; }
  if(n===3){
    const e = parseInt($('#edadTit').value,10);
    if(!(e>=16 && e<=99)){ $('#err2').textContent='Ingresa tu edad (entre 16 y 99 años).'; $('#edadTit').focus(); return; }
    const vacia = [...document.querySelectorAll('#cargasLista input')].find(i=>!(parseInt(i.value,10)>=0 && parseInt(i.value,10)<=99) || i.value==='');
    if(vacia){ $('#err2').textContent='Ingresa la edad de cada carga (si es menor de 1 año, escribe 0).'; vacia.focus(); return; }
    $('#err2').textContent=''; estado.edadTit = e;
  }
  document.querySelectorAll('.paso').forEach(p=>p.classList.toggle('oculto', p.dataset.paso != n));
  document.querySelectorAll('.paso-dot').forEach(d=>d.classList.toggle('on', +d.dataset.p <= n));
}

/* Motor de comparación: precio total = plan (base × factores) + GES (prima × personas) */
function calcular(){
  estado.region = +$('#region').value;
  const g = grupo(), f = g.reduce((a,p)=>a+p.f,0), n = g.length, tope7 = siete();
  const pos = estado.region - 1;
  const enRegion = PLANES_DATA.planes
    .filter(p => p.r[pos]==='S')
    .map(p => {
      const plan = p.pb * f * UF, ges = (GES[p.i]||0) * n * UF, clp = plan + ges;
      return {...p, plan, ges, clp, dentro: clp <= tope7};
    });
  // Planes hasta 60% sobre el 7%; si son pocos, se completan con los más económicos para que siempre haya con qué comparar
  let lista = enRegion.filter(p => p.clp <= tope7*1.6);
  if(lista.length < 12) lista = [...enRegion].sort((a,b)=>a.clp-b.clp).slice(0,12);

  const norm = (v,min,max)=> max>min ? (v-min)/(max-min) : 0;
  // Lo que el cliente paga sobre su 7% (por ley nunca paga menos que su 7%)
  const adic = p => Math.max(0, p.clp - tope7), aMax = Math.max(...lista.map(adic));
  lista.forEach(p=>{
    let s = 0;
    if(estado.prio==='hosp')   s = p.ch*1.2 + p.ca*0.5;
    if(estado.prio==='amb')    s = p.ca*1.2 + p.ch*0.5;
    // Pagar lo menos posible: si cabe en su 7%, todos le cuestan lo mismo → mejor cobertura; si no, el menor adicional
    if(estado.prio==='precio') s = p.dentro ? 150 + (p.ch+p.ca)*0.5 : (1-norm(adic(p),0,aMax))*120 + (p.ch+p.ca)*0.1;
    if(estado.prio==='libre')  s = (p.m==='L'?60:0) + p.ch*0.7 + p.ca*0.5;
    s += p.dentro ? 18 : 0;
    s += Math.min(Math.log10((p.z||0)+1)*6, 18);      // señal social: cotizantes vigentes reales
    s -= norm(adic(p),0,aMax)*12;                     // solo castiga lo que pagaría sobre su 7%
    p.score = s;
  });
  ranking = lista.sort((a,b)=>b.score-a.score);
  mostrados = 3; planInteres = null; $('#planSel').hidden = true;
  render();
  $('#resultados').style.display='block';
  $('#resultados').scrollIntoView({behavior:'smooth'});
}
const modalidad = p => p.m==='L' ? 'Libre elección' : p.m==='C' ? 'Plan cerrado' : 'Prestador preferente';
let simuloYa = false;
function render(){
  $('#sinSim').hidden = true; $('#leadCampos').hidden = false;
  if(!simuloYa){ simuloYa = true; if(window.fbq) fbq('trackCustom', 'Simulacion'); }
  const w = $('#ticketsWrap'); w.innerHTML='';
  const tope7 = siete(), g = grupo(), f = g.reduce((a,p)=>a+p.f,0);
  // Si cambió la UF, recalcula montos manteniendo el orden
  ranking.forEach(p=>{ p.plan = p.pb*f*UF; p.ges = (GES[p.i]||0)*g.length*UF; p.clp = p.plan+p.ges; p.dentro = p.clp <= tope7; });
  const nCaben = ranking.filter(p=>p.dentro).length;
  $('#resSub').textContent = nCaben
    ? `Con una renta de ${fmt(estado.renta)} tu 7% legal es ${fmt(tope7)}. ${nCaben.toLocaleString('es-CL')} planes caben en tu 7% en tu región; te mostramos los mejor evaluados según tu prioridad. Por ley, si un plan cuesta menos que tu 7%, igual pagas tu 7% y la diferencia se usa para mejorar el plan.`
    : `Con una renta de ${fmt(estado.renta)} tu 7% legal es ${fmt(tope7)}. Para tu grupo familiar ningún plan de tu región cabe solo con el 7%: te mostramos los más convenientes y cuánto adicional requieren. Un asesor puede ayudarte a evaluar si te conviene una isapre o Fonasa con seguro complementario.`;
  $('#resMeta').textContent = `${g.length} ${g.length===1?'persona':'personas'} · factor ${coma(f)} (Tabla Única de Factores) · UF ${fmt(UF)} · Precios con prima GES incluida · Fuente: Superintendencia de Salud, ${PLANES_DATA.periodo}`;
  ranking.slice(0,mostrados).forEach((p,ix)=>{
    const t = document.createElement('article');
    t.className = 'ticket' + (ix===0?' destacado':'');
    t.innerHTML = `
      ${ix===0?'<div class="badge-top">Mejor calce para ti</div>':''}
      <div class="tk-head">
        <div class="tk-isapre">${p.i}</div>
        <div class="tk-plan">${p.n}</div>
        <div class="tk-cod">Código Superintendencia: ${p.c}</div>
      </div>
      <div class="tk-precio">
        <div class="clp">${fmt(p.clp)}<small> /mes aprox.</small></div>
        <div class="desglose">Plan <b>${fmt(p.plan)}</b> + GES <b>${fmt(p.ges)}</b></div>
        <div class="uf">${p.pb.toFixed(2)} UF × factor ${coma(f)} + GES ${g.length} × ${String(GES[p.i]).replace('.',',')} UF</div>
        <span class="tag-7 ${p.dentro?'dentro':'excede'}">${p.dentro ? 'Cabe en tu 7%' : 'Requiere adicional de ' + fmt(p.clp - tope7)}</span>
        ${p.clp < tope7 ? `<div class="nota-7">Este plan cuesta menos que tu 7%. La diferencia (${fmt(tope7 - p.clp)}) se usa para mejorar tu plan, y eso lo vemos contigo. Tú pagas tu 7%: <b>${fmt(tope7)}</b> al mes.</div>` : ''}
      </div>
      <div class="tk-datos">
        <div class="d"><b>${p.ch}%</b><span>bonif. hospitalaria</span></div>
        <div class="d"><b>${p.ca}%</b><span>bonif. ambulatoria</span></div>
        <div class="d"><b>${p.t ? p.t.toLocaleString('es-CL')+' UF' : 'Sin tope'}</b><span>tope anual</span></div>
        <div class="d"><b>${modalidad(p)}</b><span>modalidad</span></div>
      </div>
      ${p.z>20 ? `<div class="tk-social"><b>${p.z.toLocaleString('es-CL')} personas</b> tienen este plan hoy (dato oficial)</div>`:''}
      <div class="tk-cta"><button class="btn btn-verde" onclick="pedirInforme(${ix})">Me interesa este plan</button></div>`;
    w.appendChild(t);
  });
  $('#verMas').style.display = mostrados < ranking.length ? 'inline-flex' : 'none';
  if(!ranking.length){
    w.innerHTML = '<p style="color:var(--gris)">Con ese presupuesto no encontramos planes individuales en tu región dentro de un rango razonable. Fonasa más un seguro complementario puede ser tu mejor opción — pide la asesoría gratuita y lo vemos contigo, sin costo.</p>';
  }
  if(planInteres) mostrarPlanSel();
}
function verMas(){ mostrados += 3; render(); }

/* ─── Solicitud de informe ─── */
let planInteres = null, ultimoMensaje = '', ultimoNombre = '';
function pedirInforme(ix){
  planInteres = ranking[ix];
  mostrarPlanSel();
  $('#leadForm').hidden = false; $('#leadDone').hidden = true;
  $('#asesoria').scrollIntoView({behavior:'smooth'});
  $('#leadNombre').focus({preventScroll:true});
}
function mostrarPlanSel(){
  const p = planInteres; if(!p) return;
  $('#planSel').innerHTML = `Plan seleccionado<b>${p.i} — ${p.n}</b>${fmt(p.clp)} al mes aprox. · ${p.clp < siete() ? `cabe en tu 7%: pagas ${fmt(siete())} y la diferencia mejora tu plan` : p.dentro ? 'cabe en tu 7%' : 'requiere adicional de ' + fmt(p.clp - siete())}`;
  $('#planSel').hidden = false;
}

/* Aviso de cambio de tramo: si al cumplir un año más el factor sube */
function avisosTramo(g){
  return g.filter(p=> p.edad < 98 && factorDe(p.edad+1, p.carga) > p.f)
          .map(p=> `${p.rol==='Titular'?'El titular':p.rol} cumple ${p.edad+1} pronto: su factor pasaría de ${coma(p.f)} a ${coma(factorDe(p.edad+1,p.carga))}`);
}

function armarMensaje(nombre){
  const L = [];
  L.push(`Hola, soy ${nombre}. Quiero mi informe gratuito de SimulaTuIsapre.`);
  L.push(`*Folio:* ${FOLIO}`);
  if(!estado.renta || !ranking.length){
    L.push('', '(Aún no completé la simulación).');
    return L.join('\n');
  }
  const g = grupo(), f = g.reduce((a,p)=>a+p.f,0), tope7 = siete();
  const region = REGIONES.find(r=>r.i===estado.region)?.n || '';
  const personas = g.map(p=> p.rol==='Titular' ? `titular ${p.edad} años` : `${p.rol.toLowerCase()} ${p.edad}`).join('; ');
  L.push('', '*Mi perfil*');
  L.push(`Renta imponible: ${fmt(estado.renta)} (7%: ${fmt(tope7)})`);
  L.push(`Grupo: ${personas} · factor ${coma(f)}`);
  L.push(`Región: ${region}` + (estado.prevision ? ` · Hoy estoy en: ${estado.prevision}` : ''));
  L.push(`Prioridad: ${PRIO[estado.prio]}`);
  const clinica = $('#leadClinica').value.trim();
  if(clinica) L.push(`Clínica de preferencia: ${clinica}`);
  const fichaPlan = p => [
    `${p.i} — ${p.n} (cód. ${p.c})`,
    `Total aprox.: ${fmt(p.clp)}/mes (plan ${fmt(p.plan)} + GES ${fmt(p.ges)})`,
    p.dentro ? `Cabe en mi 7% (pago ${fmt(tope7)})` : `Requiere adicional de ${fmt(p.clp - tope7)}`,
    `Hosp. ${p.ch}% · Amb. ${p.ca}% · Tope ${p.t ? p.t.toLocaleString('es-CL')+' UF' : 'sin tope'} · ${modalidad(p)}`];
  const vistos = ranking.slice(0, mostrados);
  if(planInteres){
    L.push('', '*Plan que me interesó*', ...fichaPlan(planInteres));
    const otras = vistos.filter(p=>p.c!==planInteres.c).slice(0,2);
    if(otras.length){ L.push('', '*Otras opciones que vi*'); otras.forEach(p=>L.push(`• ${p.i} — ${p.n}: ${fmt(p.clp)}`)); }
  } else {
    L.push('', '*Opciones que vi*'); vistos.slice(0,3).forEach(p=>L.push(`• ${p.i} — ${p.n} (cód. ${p.c}): ${fmt(p.clp)}`));
  }
  const av = avisosTramo(g);
  if(av.length) L.push('', '*Nota de tramo*', ...av);
  return L.join('\n');
}

/* Píxel de Meta: solo se activa si la persona acepta las cookies */
const PREF_CK = 'sti_cookies';
function leerPref(){ try{ return localStorage.getItem(PREF_CK); }catch(e){ return null; } }
function guardarPref(v){ try{ localStorage.setItem(PREF_CK, v); }catch(e){} }
function activarPixel(){
  if(window.fbq || !CONFIG.metaPixelId) return;
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
  s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', CONFIG.metaPixelId); fbq('track', 'PageView');
}
function evento(nombre, datos){ if(window.fbq) fbq('track', nombre, datos || {}); }
if(CONFIG.metaPixelId){
  const pref = leerPref();
  if(pref === 'si') activarPixel();
  else if(pref !== 'no') $('#avisoCookies').hidden = false;
  $('#ckSi').addEventListener('click', ()=>{ guardarPref('si'); $('#avisoCookies').hidden = true; activarPixel(); });
  $('#ckNo').addEventListener('click', ()=>{ guardarPref('no'); $('#avisoCookies').hidden = true; });
}

/* Guarda la solicitud en la planilla de leads antes de abrir WhatsApp */
function datosLead(nombre, fono, mail){
  const d = {folio:FOLIO, nombre, whatsapp:fono, correo:mail, clinica:$('#leadClinica').value.trim(), web:$('#leadWeb').value, mensaje:ultimoMensaje, origen:ORIGEN};
  if(estado.renta && ranking.length){
    const g = grupo(), tope7 = siete(), p = planInteres;
    Object.assign(d, {renta:estado.renta, siete:tope7, personas:g.length,
      grupo: g.map(x=> x.rol==='Titular' ? `Titular ${x.edad}` : `${x.rol} ${x.edad}`).join('; '),
      region: REGIONES.find(r=>r.i===estado.region)?.n || '', prevision: estado.prevision, prioridad: PRIO[estado.prio],
      tramo: avisosTramo(g).join(' | ')});
    if(p) Object.assign(d, {isapre:p.i, plan:p.n, codigo:p.c, total:p.clp, cabe:p.dentro, adicional: p.dentro ? 0 : p.clp - tope7});
    d.otras = ranking.slice(0, mostrados).filter(x=> !p || x.c!==p.c).slice(0, p ? 2 : 3)
                     .map(x=> `${x.i} — ${x.n} (${x.c}): ${fmt(x.clp)}`).join(' | ');
  }
  return d;
}
function guardarLead(d){
  if(!CONFIG.planillaUrl) return;
  const body = JSON.stringify(d);
  // 1) fetch PRIMERO: petición legítima de la página que los bloqueadores
  //    (Brave Shields, uBlock, etc.) NO matan. keepalive:true hace que
  //    sobreviva aunque el usuario salte a WhatsApp en otra pestaña.
  fetch(CONFIG.planillaUrl, {
    method:'POST', mode:'no-cors', keepalive:true,
    headers:{'Content-Type':'text/plain;charset=UTF-8'},
    body
  }).catch(()=>{});
  // 2) sendBeacon DESPUÉS, como segundo intento redundante (SIN return).
  //    Si el navegador lo bloquea y "miente" devolviendo true, da igual:
  //    el fetch de arriba ya mandó la carta de verdad. Y como tu doPost
  //    deduplica por folio (el lock serializa y la 2ª petición ve el folio
  //    existente y NO reenvía correos), recibir las dos cartas es 100%
  //    seguro: no se duplica fila ni correo.
  try{
    navigator.sendBeacon && navigator.sendBeacon(
      CONFIG.planillaUrl,
      new Blob([body], {type:'text/plain;charset=UTF-8'})
    );
  }catch(e){}
}

function enviarWhatsApp(){
  const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(ultimoMensaje)}`;
  const w = window.open(url, '_blank');
  if(!w) location.href = url;   // si el navegador bloquea la ventana, abre en la misma pestaña
}
function cuandoRespondemos(){
  const p = new Intl.DateTimeFormat('es-CL',{weekday:'short',hour:'numeric',hour12:false,timeZone:'America/Santiago'}).formatToParts(new Date());
  const dia = p.find(x=>x.type==='weekday').value.toLowerCase(), hora = +p.find(x=>x.type==='hour').value;
  const habil = !/^(sáb|dom)/.test(dia);
  return habil && hora>=9 && hora<17 ? 'Te respondemos hoy mismo por WhatsApp.' : 'Te respondemos por WhatsApp el próximo día hábil.';
}
function volverASimular(){
  $('#leadDone').hidden = true; $('#leadForm').hidden = false;
  $('#simulador').scrollIntoView({behavior:'smooth'});
}

$('#btnSimPrimero').addEventListener('click', ()=>{
  $('#simulador').scrollIntoView({behavior:'smooth'});
  setTimeout(()=>$('#renta').focus({preventScroll:true}), 400);
});

$('#leadForm').addEventListener('submit', e=>{
  e.preventDefault();
  if(!ranking.length){ $('#simulador').scrollIntoView({behavior:'smooth'}); return; }
  const nombre = $('#leadNombre').value.trim(), fono = $('#leadFono').value.trim(), mail = $('#leadMail').value.trim();
  if(!nombre || fono.replace(/\D/g,'').length < 8){ alert('Revisa tu nombre y número de WhatsApp.'); return; }
  ultimoNombre = nombre;
  ultimoMensaje = armarMensaje(nombre);
  guardarLead(datosLead(nombre, fono, mail));
  evento('Lead', planInteres ? {content_name: planInteres.i, value: Math.round(planInteres.clp), currency:'CLP'} : {});
  if(CONFIG.formspreeId){
    fetch(`https://formspree.io/f/${CONFIG.formspreeId}`, {method:'POST', headers:{'Accept':'application/json','Content-Type':'application/json'},
      body: JSON.stringify({folio:FOLIO, nombre, whatsapp:fono, email:mail, mensaje:ultimoMensaje})}).catch(()=>{});
  }
  enviarWhatsApp();
  $('#doneTitulo').textContent = `¡Listo, ${nombre.split(' ')[0]}!`;
  $('#doneFolio').textContent = FOLIO;
  $('#doneCuando').textContent = cuandoRespondemos() + ' Guarda tu folio por si necesitas consultarnos.';
  $('#leadForm').hidden = true; $('#leadDone').hidden = false;
});

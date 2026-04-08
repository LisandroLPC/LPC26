/* LOS POLLOS CUÑADOS v6 */
const SB='https://pfxvkvvzxpwobtynupgk.supabase.co';
const SK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmeHZrdnZ6eHB3b2J0eW51cGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjM3NjIsImV4cCI6MjA5MDczOTc2Mn0.H2tqmv0T9npDmNW3Pid2qnUSze7EHvO1ky0-NQzmFIY';
const SBH={'apikey':SK,'Authorization':'Bearer '+SK,'Content-Type':'application/json','Prefer':'return=minimal'};
async function sbQ(t,q=''){const r=await fetch(SB+'/rest/v1/'+t+'?'+q,{headers:SBH});if(!r.ok)throw new Error(await r.text());return r.json();}
async function sbUp(t,d){const arr=Array.isArray(d)?d:[d];const r=await fetch(SB+'/rest/v1/'+t,{method:'POST',headers:{...SBH,'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(arr)});if(!r.ok)throw new Error(await r.text());}
async function sbDel(t,id){const r=await fetch(SB+'/rest/v1/'+t+'?id=eq.'+encodeURIComponent(id),{method:'DELETE',headers:SBH});if(!r.ok)throw new Error(await r.text());}

const LC={g(k){try{return JSON.parse(localStorage.getItem('lpc6_'+k))||null}catch{return null}},s(k,v){localStorage.setItem('lpc6_'+k,JSON.stringify(v))}};

let S={
  us:LC.g('us')||[],sg:LC.g('sg')||[],vr:LC.g('vr')||[],
  ve:LC.g('ve')||{},caja:LC.g('caja')||{},
  co:LC.g('co')||[],coi:LC.g('coi')||[],
  ct:LC.g('ct')||[],cti:LC.g('cti')||[],
  el:LC.g('el')||[],eli:LC.g('eli')||[],
  ga:LC.g('ga')||{},ins:LC.g('ins')||[],
  cierres:LC.g('cierres')||{},
  cfg:LC.g('cfg')||{},
};
// Garantizar que cfg siempre tenga los campos necesarios aunque venga de localStorage sin ellos
if(!S.cfg.mp||!S.cfg.mp.length)S.cfg.mp=[
  {id:'qr_mp',label:'QR Mercado Pago',pct:3.99},
  {id:'qr_otro',label:'QR otro medio',pct:2.50},
  {id:'debito',label:'Tarjeta débito',pct:1.10},
  {id:'credito_1c',label:'Tarjeta crédito (1 cuota)',pct:4.00},
  {id:'credito_3c',label:'Tarjeta crédito (3 cuotas)',pct:8.50},
  {id:'transferencia',label:'Transferencia bancaria',pct:0},
];
if(!S.cfg.gasCats||!S.cfg.gasCats.length)S.cfg.gasCats=['Alquiler','Servicios','Personal','Embalaje','Limpieza','Comisiones digitales','Otros'];

let tab='caja',day=arDay(),online=navigator.onLine;
let sesion=LC.g('sesion')||null;
let ticketItems=[],corteItems=[],elabItems=[],compraItems=[];
let pagoSeleccionado='Efectivo';
let charts={},rMonth=arMonth(),rTab='dia',prodTab='corte';
let loginRol='dueno',pinBuf='';

const BILLETES=[20000,10000,2000,1000,500,200,100,50];
const UNITS=['kg','unidad','litro','docena','bandeja','bolsa','gramo','paquete'];

/* UTILS */
function arNow(){return new Date(new Date().toLocaleString('en-US',{timeZone:'America/Argentina/Buenos_Aires'}))}
function arDay(){const d=arNow();return d.getFullYear()+'-'+(d.getMonth()+1).toString().padStart(2,'0')+'-'+d.getDate().toString().padStart(2,'0')}
function arMonth(){const d=arNow();return d.getFullYear()+'-'+(d.getMonth()+1).toString().padStart(2,'0')}
function arTime(){return arNow().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}
function getPrevDay(d){const dt=new Date(d+'T12:00:00');dt.setDate(dt.getDate()-1);return dt.toISOString().split('T')[0]}
function fD(s){if(!s)return'';const[,m,d]=s.split('-');return d+'/'+m}
function fDL(s){if(!s)return'';const[y,m,d]=s.split('-');return d+'/'+m+'/'+y}
function fM(s){if(!s)return'';const[y,m]=s.split('-');return['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][+m-1]+' '+y}
function $m(n){return'$'+Math.round(n||0).toLocaleString('es-AR')}
function $d2(n){return'$'+(+(n||0)).toFixed(2)}
function fQ(n,u){return(+(n||0)).toFixed(2).replace(/\.00$/,'')+(u?' '+u:'')}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,5)}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function dV(){return S.ve[day]||[]}
function dG(){return S.ga[day]||[]}
function dCaja(){return S.caja[day]||[]}
function sgV(){return S.sg.filter(g=>g.tipo==='venta'||!g.tipo)}
function sgP(){return S.sg.filter(g=>g.tipo==='produccion')}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),2400)}
function sync(s,l){const d=document.getElementById('sdot'),lb=document.getElementById('slbl');if(d){d.className='sdot '+s;lb.textContent=l}}
function save(){LC.s('us',S.us);LC.s('sg',S.sg);LC.s('vr',S.vr);LC.s('ve',S.ve);LC.s('caja',S.caja);LC.s('co',S.co);LC.s('coi',S.coi);LC.s('ct',S.ct);LC.s('cti',S.cti);LC.s('el',S.el);LC.s('eli',S.eli);LC.s('ga',S.ga);LC.s('ins',S.ins);LC.s('cierres',S.cierres);LC.s('cfg',S.cfg);}
function toggleDetail(id){const el=document.getElementById(id);if(el)el.style.display=el.style.display==='none'?'block':'none';}

window.addEventListener('online',()=>{online=true;loadAll()});
window.addEventListener('offline',()=>{online=false;sync('err','offline')});

/* LOGIN */
function selUser(r){loginRol=r;pinBuf='';document.getElementById('usel-dueno').classList.toggle('active',r==='dueno');document.getElementById('usel-empleado').classList.toggle('active',r==='empleado');upPD();}
function pinPress(d){if(pinBuf.length>=6)return;pinBuf+=d;upPD();}
function pinClear(){pinBuf='';upPD();document.getElementById('pin-error').textContent='';}
function upPD(){const el=document.getElementById('pin-display');if(el)el.textContent=pinBuf?'●'.repeat(pinBuf.length):'····';}
async function pinOk(){
  if(!pinBuf){document.getElementById('pin-error').textContent='Ingresá tu PIN';return;}
  let usr=S.us.find(u=>u.rol===loginRol&&u.pin===pinBuf&&u.activo!==false);
  if(!usr){if(loginRol==='dueno'&&pinBuf==='1234')usr={id:'usr_dueno',nombre:'Dueño',rol:'dueno'};else if(loginRol==='empleado'&&pinBuf==='0000')usr={id:'usr_empleado',nombre:'Empleado',rol:'empleado'};}
  if(!usr){document.getElementById('pin-error').textContent='PIN incorrecto';pinBuf='';upPD();return;}
  sesion={id:usr.id,nombre:usr.nombre,rol:usr.rol};LC.s('sesion',sesion);
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app-screen').style.display='block';
  initApp();
}
function doLogout(){sesion=null;LC.s('sesion',null);pinBuf='';upPD();document.getElementById('login-screen').style.display='flex';document.getElementById('app-screen').style.display='none';}

const NAV_D=[{id:'caja',i:'💰',l:'Caja'},{id:'stock',i:'📦',l:'Stock'},{id:'prod',i:'🔪',l:'Prod.'},{id:'compras',i:'🛒',l:'Compras'},{id:'reportes',i:'📊',l:'Reportes'}];
const NAV_E=[{id:'caja',i:'💰',l:'Caja'},{id:'gastos',i:'🧾',l:'Gastos'}];

function buildNav(){
  const items=sesion?.rol==='dueno'?NAV_D:NAV_E;
  document.getElementById('bottom-nav').innerHTML=items.map(n=>`<div class="bni ${n.id===tab?'active':''}" id="bn-${n.id}" onclick="go('${n.id}')"><div class="bi">${n.i}</div><div class="bl">${n.l}</div></div>`).join('');
}
function go(t){tab=t;document.querySelectorAll('.bni').forEach(el=>el.classList.toggle('active',el.id==='bn-'+t));render();}
function chDay(d){const dt=new Date(day+'T12:00:00');dt.setDate(dt.getDate()+d);const nd=dt.toISOString().split('T')[0];if(nd>arDay())return;day=nd;render();}

function initApp(){day=arDay();buildNav();sync('busy','cargando...');loadAll().then(()=>{if(!online)sync('err','offline')});render();}

async function loadAll(){
  if(!online){sync('err','offline');return}
  sync('busy','cargando...');
  try{
    const[us,sg,vr,ve,caja,co,coi,ct,cti,el,eli,ga,ins]=await Promise.all([
      sbQ('usuarios'),sbQ('stock_groups','order=name'),sbQ('stock_variants','order=name'),
      sbQ('ventas','order=created_at'),sbQ('caja_movimientos','order=created_at'),
      sbQ('compras','order=created_at'),sbQ('compras_items','order=created_at'),
      sbQ('cortes','order=created_at'),sbQ('cortes_items','order=created_at'),
      sbQ('elaboraciones','order=created_at'),sbQ('elaboraciones_items','order=created_at'),
      sbQ('gastos','order=created_at'),sbQ('insumos','order=name'),
    ]);
    S.us=us;S.sg=sg;S.vr=vr;S.co=co;S.coi=coi;S.ct=ct;S.cti=cti;S.el=el;S.eli=eli;
    S.ins=ins.map(i=>({...i,costUnit:i.cost_unit||0,stock_qty:i.stock_qty||0}));
    const vm={},gm={},cm={};
    ve.forEach(x=>{if(!vm[x.day])vm[x.day]=[];vm[x.day].push(x)});
    ga.forEach(x=>{if(!gm[x.day])gm[x.day]=[];gm[x.day].push(x)});
    caja.forEach(x=>{if(!cm[x.day])cm[x.day]=[];cm[x.day].push(x)});
    S.ve=vm;S.ga=gm;S.caja=cm;
    save();sync('ok','sincronizado');render();
  }catch(e){sync('err','error sync');console.error(e)}
}

function render(){
  if(!sesion)return;
  const isT=day===arDay();
  document.getElementById('hdr-sub').textContent=(isT?'Hoy · ':'')+fDL(day)+' · '+sesion.nombre;
  document.getElementById('dnd').textContent=isT?'Hoy':fD(day);
  Object.values(charts).forEach(c=>{try{c.destroy()}catch(e){}});charts={};
  const c=document.getElementById('content');
  if(tab==='caja')c.innerHTML=rCaja();
  else if(tab==='stock')c.innerHTML=rStock();
  else if(tab==='prod'){c.innerHTML=rProd();if(prodTab==='corte')renderCorteItems();else renderElabItems();}
  else if(tab==='compras'){c.innerHTML=rCompras();renderCompraItems();}
  else if(tab==='gastos')c.innerHTML=rGastos();
  else if(tab==='reportes'){c.innerHTML=rReportes();initCharts();}
}

/* ══ CAJA ══════════════════════════════════════════════════════ */
function rCaja(){
  const vs=dV(),tv=vs.reduce((s,v)=>s+v.total,0);
  const ef=vs.filter(v=>v.pago==='Efectivo'||v.pago_ef>0).reduce((s,v)=>s+(v.pago==='Efectivo'?v.total:(v.pago_ef||0)),0);
  const movs=dCaja();
  const ingEf=movs.filter(m=>m.tipo==='ingreso'&&m.metodo==='efectivo').reduce((s,m)=>s+m.monto,0);
  const egEf=movs.filter(m=>m.tipo==='egreso'&&m.metodo==='efectivo').reduce((s,m)=>s+m.monto,0);
  const ingTr=movs.filter(m=>m.tipo==='ingreso'&&m.metodo==='transferencia').reduce((s,m)=>s+m.monto,0);
  const egTr=movs.filter(m=>m.tipo==='egreso'&&m.metodo==='transferencia').reduce((s,m)=>s+m.monto,0);
  const ga=dG().reduce((s,g)=>s+g.amount,0);
  const cajaEf=ef+ingEf-egEf;
  const cajaTr=(tv-ef)+ingTr-egTr;
  const resultado=tv+ingEf+ingTr-egEf-egTr-ga;

  // ticket en proceso
  const tktTotal=ticketItems.reduce((s,x)=>s+x.total,0);
  const vrOpts=S.vr.map(v=>{const g=sgV().find(x=>x.id===v.group_id);return`<option value="${v.id}" data-p="${v.price}" data-k="${v.qty_per_unit}">${esc(g?g.name+' › ':'')}${esc(v.name)}</option>`}).join('');

  // ventas del dia agrupadas por ticket_id
  const byTicket={};
  vs.forEach(v=>{const tk=v.ticket_id||v.id;if(!byTicket[tk])byTicket[tk]={items:[],total:0,pago:'',time:v.time||''};byTicket[tk].items.push(v);byTicket[tk].total+=v.total;byTicket[tk].pago=v.pago||'';});
  const ticketsSorted=Object.entries(byTicket).sort((a,b)=>a[1].time.localeCompare(b[1].time));
  const vRows=ticketsSorted.length?ticketsSorted.map(([tid,tk],idx)=>{
    const itemList=tk.items.map(v=>{const vr=S.vr.find(x=>x.id===v.variant_id),gr=S.sg.find(x=>x.id===v.group_id);return`<div style="font-size:10px;color:var(--tx3);padding:1px 0">${esc(gr?gr.name:'–')}${vr?' › '+esc(vr.name):''} ×${v.qty} = ${$m(v.total)}</div>`;}).join('');
    const pagoTag=tk.pago==='mixto'?`<span class="tag tp">mix</span>`:`<span class="tag tv">${(tk.pago||'').slice(0,3)}</span>`;
    return`<tr>
      <td style="font-family:var(--mo);color:var(--tx3);font-size:11px">#${idx+1}</td>
      <td>${tk.time}</td>
      <td><div>${itemList}</div></td>
      <td style="font-weight:500">${$m(tk.total)}</td>
      <td>${pagoTag}</td>
      <td><button class="dbtn" onclick="delTicket('${tid}')">✕</button></td>
    </tr>`;
  }).join(''):`<tr><td colspan="6" class="empty-row">Sin ventas</td></tr>`;

  const compraGastoIds=new Set(S.co.map(c=>c.gasto_id).filter(Boolean));
  const gasOp=dG().filter(g=>!compraGastoIds.has(g.id));
  const gaEf=gasOp.filter(g=>g.metodo!=='transferencia').reduce((s,g)=>s+g.amount,0);
  const gasRows=gasOp.length?gasOp.map(g=>`<tr><td>${g.time||''}</td><td style="max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(g.descripcion)}</td><td><span class="tag tg">${(g.cat||'').slice(0,5)}</span></td><td>${$m(g.amount)}</td><td><span class="tag ${g.metodo==='transferencia'?'tp':'tv'}">${g.metodo==='transferencia'?'Tr.':'Ef.'}</span></td><td><button class="dbtn" onclick="delGa('${g.id}')">✕</button></td></tr>`).join(''):`<tr><td colspan="6" class="empty-row">Sin gastos</td></tr>`;

  const mRows=movs.length?movs.map(m=>`<tr><td>${m.time||''}</td><td>${esc(m.descripcion)}</td><td><span class="tag ${m.tipo==='ingreso'?'tv':'tg'}">${m.tipo}</span></td><td style="color:${m.tipo==='ingreso'?'var(--gn)':'var(--rd)'}">${m.tipo==='ingreso'?'+':'-'}${$m(m.monto)}</td><td><span class="tag tp">${m.metodo.slice(0,3)}</span></td><td><button class="dbtn" onclick="delMov('${m.id}')">✕</button></td></tr>`).join(''):`<tr><td colspan="6" class="empty-row">Sin movimientos</td></tr>`;

  const prevDay=getPrevDay(day);
  const cierrePrev=S.cierres?.[prevDay];
  const cierreHoy=S.cierres?.[day];
  const fondoInicial=cierreHoy?.fondo_inicial_manual??cierrePrev?.saldo_siguiente??0;

  return`
  <div class="kpis">
    <div class="kc hi"><div class="kl">Ventas</div><div class="kv a">${$m(tv)}</div><div class="kh">${vs.length} ítems · ${Object.keys(byTicket).length} tickets</div></div>
    <div class="kc"><div class="kl">Resultado</div><div class="kv ${resultado>=0?'g':'r'}">${$m(resultado)}</div></div>
    <div class="kc"><div class="kl">Efectivo caja</div><div class="kv">${$m(cajaEf)}</div></div>
    <div class="kc"><div class="kl">Transferencias</div><div class="kv">${$m(cajaTr)}</div></div>
  </div>
  ${fondoInicial>0?`<div class="info-box green">💵 Fondo inicial del día: ${$m(fondoInicial)}</div>`:''}

  <!-- TICKET -->
  <div class="blk" style="border-color:rgba(232,197,71,.4)">
    <div class="bt">🧾 Ticket en proceso</div>
    <div class="fr">
      <div class="fl" style="flex:3"><label>Producto</label>
        <select id="tk-var" onchange="onTKVar()">${vrOpts||'<option value="">Sin variantes</option>'}</select>
      </div>
      <div class="fl" style="max-width:58px"><label>Cant.</label>
        <input type="number" id="tk-qty" value="1" min="0.1" step="0.1" oninput="calcTK()">
      </div>
    </div>
    <div class="fr">
      <div class="fl"><label>Precio $</label><input type="number" id="tk-price" placeholder="0" oninput="calcTK()"></div>
      <div class="fl" style="max-width:70px"><label>Desc %</label><input type="number" id="tk-desc" placeholder="0" min="0" max="100" oninput="calcTK()"></div>
      <div class="fl"><label>Subtotal</label><input type="text" id="tk-sub" readonly style="color:var(--ac)"></div>
      <button class="btn" onclick="addTKItem()" style="align-self:flex-end;background:var(--sf2)">+ Ítem</button>
    </div>
    <!-- items del ticket en proceso -->
    <div id="tk-items"></div>
    ${ticketItems.length?`
    <div class="sep"></div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <span style="font-size:13px;font-weight:600">Total ticket</span>
      <span style="font-size:20px;font-weight:700;font-family:var(--mo);color:var(--ac)">${$m(tktTotal)}</span>
    </div>
    <div style="font-size:9px;color:var(--tx2);font-family:var(--mo);margin-bottom:7px">FORMA DE PAGO</div>
    <div style="display:flex;gap:7px;margin-bottom:10px">
      <button id="pago-btn-ef" onclick="selPago('Efectivo')" style="flex:1;padding:9px 4px;border-radius:8px;border:1.5px solid ${pagoSeleccionado==='Efectivo'?'var(--gn)':'var(--br2)'};background:${pagoSeleccionado==='Efectivo'?'rgba(74,222,128,.12)':'var(--sf2)'};color:${pagoSeleccionado==='Efectivo'?'var(--gn)':'var(--tx2)'};font-size:12px;font-weight:700;cursor:pointer;font-family:var(--sa)">💵 Efectivo</button>
      <button id="pago-btn-tr" onclick="selPago('Transferencia')" style="flex:1;padding:9px 4px;border-radius:8px;border:1.5px solid ${pagoSeleccionado==='Transferencia'?'var(--bl)':'var(--br2)'};background:${pagoSeleccionado==='Transferencia'?'rgba(96,165,250,.12)':'var(--sf2)'};color:${pagoSeleccionado==='Transferencia'?'var(--bl)':'var(--tx2)'};font-size:12px;font-weight:700;cursor:pointer;font-family:var(--sa)">📲 Transf.</button>
      <button id="pago-btn-mix" onclick="selPago('mixto')" style="flex:1;padding:9px 4px;border-radius:8px;border:1.5px solid ${pagoSeleccionado==='mixto'?'var(--ac)':'var(--br2)'};background:${pagoSeleccionado==='mixto'?'rgba(232,197,71,.12)':'var(--sf2)'};color:${pagoSeleccionado==='mixto'?'var(--ac)':'var(--tx2)'};font-size:12px;font-weight:700;cursor:pointer;font-family:var(--sa)">🔀 Mixto</button>
    </div>
    <div id="tk-mixto-fields" style="display:${pagoSeleccionado==='mixto'?'block':'none'}">
      <div class="fr">
        <div class="fl"><label>Efectivo $</label><input type="number" id="tk-pago-ef" placeholder="0" oninput="calcTKVuelto()"></div>
        <div class="fl"><label>Transferencia $</label><input type="number" id="tk-pago-tr" placeholder="0" oninput="calcTKVuelto()"></div>
        <div class="fl"><label>Vuelto</label><input type="text" id="tk-vuelto" readonly style="color:var(--gn)"></div>
      </div>
    </div>
    <div id="tk-mp-field" style="display:${pagoSeleccionado!=='Efectivo'?'block':'none'};margin-bottom:8px">
      <label style="font-size:9px;color:var(--tx2);font-family:var(--mo);letter-spacing:.5px">MEDIO DE COBRO DIGITAL</label>
      <select id="tk-mp-tipo" style="margin-top:4px;width:100%">
        ${(S.cfg.mp||[]).map(m=>`<option value="${m.id}" data-pct="${m.pct}">${m.label} ${m.pct>0?'('+m.pct+'%)':''}</option>`).join('')}
      </select>
    </div>
    <button class="btn btnp" onclick="cerrarTicket()" style="width:100%">✓ Cerrar ticket</button>
    <button class="btn" onclick="cancelarTicket()" style="width:100%;margin-top:6px;background:var(--sf2);color:var(--rd);border-color:rgba(248,113,113,.4)">✕ Cancelar venta</button>
    `:'<div style="font-size:11px;color:var(--tx3);font-family:var(--mo);padding:6px 0">Agregá ítems para armar el ticket</div>'}
  </div>

  <div class="tbk"><div class="tt">Ventas del día (por ticket)</div>
    <table><thead><tr><th>#</th><th>Hora</th><th>Ítems</th><th>Total</th><th>Pago</th><th></th></tr></thead>
    <tbody>${vRows}</tbody></table>
  </div>

  <div class="blk" style="border-color:rgba(248,113,113,.3)">
    <div class="bt">Gastos operativos (alquiler, luz, personal, etc.)</div>
    <div class="fr">
      <div class="fl" style="flex:2"><label>Descripción</label><input type="text" id="g-d" placeholder="Ej: Alquiler, luz, retiro personal..."></div>
      <div class="fl"><label>Categoría</label>
        <select id="g-c">${(S.cfg.gasCats||[]).map(c=>`<option>${esc(c)}</option>`).join('')}</select>
      </div>
    </div>
    <div class="fr">
      <div class="fl"><label>Monto $</label><input type="number" id="g-a" placeholder="0"></div>
      <div class="fl" style="max-width:110px"><label>Método</label><select id="g-met"><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option></select></div>
      <button class="btn btnr" onclick="addGa()" style="align-self:flex-end">+ Gasto</button>
    </div>
  </div>
  <div class="tbk"><div class="tt">Gastos operativos del día</div>
    <table><thead><tr><th>Hora</th><th>Descripción</th><th>Cat.</th><th>Monto</th><th>Método</th><th></th></tr></thead>
    <tbody>${gasRows}</tbody></table>
  </div>

  <div class="blk"><div class="bt">Movimiento de caja (fondos / retiros extra)</div>
    <div class="fr">
      <div class="fl"><label>Tipo</label><select id="mov-tipo"><option value="ingreso">Ingreso</option><option value="egreso">Egreso</option></select></div>
      <div class="fl" style="flex:2"><label>Descripción</label><input type="text" id="mov-desc" placeholder="Ej: Fondo inicial, retiro..."></div>
    </div>
    <div class="fr">
      <div class="fl"><label>Monto $</label><input type="number" id="mov-monto" placeholder="0"></div>
      <div class="fl"><label>Método</label><select id="mov-metodo"><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option></select></div>
      <button class="btn btnp" onclick="addMov()" style="align-self:flex-end">+ Agregar</button>
    </div>
  </div>
  <div class="tbk"><div class="tt">Movimientos de caja</div>
    <table><thead><tr><th>Hora</th><th>Descripción</th><th>Tipo</th><th>Monto</th><th>Método</th><th></th></tr></thead>
    <tbody>${mRows}</tbody></table>
  </div>

  <!-- CIERRE DE CAJA -->
  <div class="blk" style="border-color:rgba(232,197,71,.5)">
    <div class="bt">Cierre de caja — efectivo</div>
    ${sesion?.rol==='dueno'?`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:7px 10px;background:var(--sf2);border-radius:7px;border:1px solid var(--br)">
      <label style="display:flex;align-items:center;gap:5px;font-size:11px;cursor:pointer;font-family:var(--mo);color:var(--tx2);white-space:nowrap">
        <input type="checkbox" id="cierre-editar-fondo" style="width:auto;accent-color:var(--ac)" onchange="toggleFondoEdit()"> Fondo inicial del día:
      </label>
      <span id="cierre-fondo-display" style="font-family:var(--mo);font-size:12px;color:var(--gn)">${$m(fondoInicial)}</span>
      <input type="number" id="cierre-fondo-manual" placeholder="0" style="display:none;max-width:100px;font-size:12px" value="${S.cierres?.[day]?.fondo_inicial_manual??fondoInicial}" oninput="calcCierre()">
    </div>`:`<div style="font-size:10px;color:var(--tx2);font-family:var(--mo);margin-bottom:10px">Fondo inicial: <span style="color:var(--gn)">${$m(fondoInicial)}</span></div>`}
    <div style="font-size:10px;color:var(--tx2);font-family:var(--mo);margin-bottom:10px">Contá los billetes para calcular el total</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:10px">
      ${BILLETES.map(b=>`<div style="display:flex;align-items:center;gap:5px;background:var(--sf2);border-radius:5px;padding:5px 8px">
        <span style="font-size:10px;font-family:var(--mo);color:var(--tx3);min-width:62px">${$m(b)}</span>
        <input type="number" id="bill_${b}" min="0" value="0" step="1" style="width:50px;padding:3px 5px;font-size:13px" oninput="calcCierre()">
        <span style="font-size:10px;font-family:var(--mo);color:var(--ac);min-width:52px" id="bsub_${b}"></span>
      </div>`).join('')}
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-top:1px solid var(--br);border-bottom:1px solid var(--br);margin-bottom:10px">
      <span style="font-size:12px;color:var(--tx2)">Total contado</span>
      <span style="font-size:20px;font-weight:700;font-family:var(--mo);color:var(--ac)" id="cierre-total">$0</span>
    </div>
    <div class="fr">
      <div class="fl"><label>Retiro del día $</label><input type="number" id="cierre-retiro" placeholder="0" value="${cierreHoy?.retiro||0}" oninput="calcCierre()"></div>
      <div class="fl"><label>Queda en caja</label><input type="text" id="cierre-saldo" readonly style="color:var(--gn);font-size:15px;font-weight:600"></div>
    </div>
    <div style="font-size:10px;color:var(--tx3);font-family:var(--mo);margin:0 0 10px">El saldo pasa como fondo del día siguiente</div>
    <div style="background:var(--sf2);border-radius:8px;padding:10px;margin-bottom:10px;border:1px solid var(--br)">
      <div style="font-size:9px;color:var(--tx2);font-family:var(--mo);margin-bottom:7px;letter-spacing:.5px">CUENTA DEL DÍA — EFECTIVO</div>
      <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px"><span style="color:var(--tx2)">Fondo inicial</span><span style="font-family:var(--mo);color:var(--gn)" id="cierre-fondo-cuenta">+${$m(fondoInicial)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px"><span style="color:var(--tx2)">Ventas efectivo</span><span style="font-family:var(--mo);color:var(--gn)">+${$m(ef)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px"><span style="color:var(--tx2)">Gastos en efectivo</span><span style="font-family:var(--mo);color:var(--rd)">-${$m(gaEf)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px"><span style="color:var(--tx2)">Retiro</span><span style="font-family:var(--mo);color:var(--rd)" id="cierre-retiro-display">-${$m(cierreHoy?.retiro||0)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:5px 0 3px;border-top:1px solid var(--br);margin-top:4px;font-size:12px;font-weight:600"><span>Debería haber</span><span style="font-family:var(--mo);color:var(--ac)" id="cierre-deberia">${$m(fondoInicial+ef-gaEf-(cierreHoy?.retiro||0))}</span></div>
      <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px"><span style="color:var(--tx2)">Queda en caja</span><span style="font-family:var(--mo)" id="cierre-contado-disp">$0</span></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;font-weight:700"><span>Diferencia</span><span style="font-family:var(--mo)" id="cierre-diferencia">—</span></div>
    </div>
    <button class="btn btnp" onclick="saveCierre()" style="width:100%">✓ Confirmar cierre</button>
    ${cierreHoy?`<div style="margin-top:8px;padding:8px;background:var(--sf2);border-radius:5px;font-size:11px;font-family:var(--mo);color:var(--tx2)">Último cierre: ${$m(cierreHoy.total_contado)} contado · Retiro: ${$m(cierreHoy.retiro)} · Fondo siguiente: <span style="color:var(--gn)">${$m(cierreHoy.saldo_siguiente)}</span></div>`:''}
  </div>`;
}

/* Ticket helpers */
function onTKVar(){const s=document.getElementById('tk-var'),o=s?.options[s.selectedIndex];if(!o)return;document.getElementById('tk-price').value=o.dataset.p||'';calcTK();}
function calcTK(){
  const s=document.getElementById('tk-var'),o=s?.options[s.selectedIndex];
  const k=parseFloat(o?.dataset?.k)||1,q=parseFloat(document.getElementById('tk-qty')?.value)||0,p=parseFloat(document.getElementById('tk-price')?.value)||0,d=parseFloat(document.getElementById('tk-desc')?.value)||0;
  const sub=document.getElementById('tk-sub');if(sub)sub.value=q*p*(1-d/100)?$m(q*p*(1-d/100)):'';
}
function calcTKVuelto(){
  const ef=parseFloat(document.getElementById('tk-pago-ef')?.value)||0,tr=parseFloat(document.getElementById('tk-pago-tr')?.value)||0;
  const tot=ticketItems.reduce((s,x)=>s+x.total,0);
  const vuelto=document.getElementById('tk-vuelto');
  if(vuelto)vuelto.value=(ef+tr)>tot?$m((ef+tr)-tot):(ef+tr)>0?'—':'';
}
function renderTKItems(){
  const list=document.getElementById('tk-items');if(!list)return;
  if(!ticketItems.length){list.innerHTML='';return;}
  const tot=ticketItems.reduce((s,x)=>s+x.total,0);
  list.innerHTML=`<div style="margin-top:8px;border-top:1px solid var(--br);padding-top:8px">`
    +ticketItems.map((x,i)=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--br)">
      <div style="font-size:12px">${esc(x.nombre)} ×${x.qty}${x.desc>0?` <span class="tag tc">-${x.desc}%</span>`:''}</div>
      <div style="display:flex;align-items:center;gap:6px"><span style="font-family:var(--mo);font-size:12px;color:var(--ac)">${$m(x.total)}</span><button class="dbtn" onclick="rmTKItem(${i})">✕</button></div>
    </div>`).join('')
    +`<div style="display:flex;justify-content:space-between;padding:6px 0;font-weight:600"><span style="font-size:12px">Subtotal</span><span style="font-family:var(--mo);font-size:14px;color:var(--ac)">${$m(tot)}</span></div></div>`;
}
function addTKItem(){
  const s=document.getElementById('tk-var'),o=s?.options[s.selectedIndex];
  const varId=s?.value,kpu=parseFloat(o?.dataset?.k)||1,qty=parseFloat(document.getElementById('tk-qty')?.value)||0;
  const price=parseFloat(document.getElementById('tk-price')?.value)||0,desc=parseFloat(document.getElementById('tk-desc')?.value)||0;
  if(!varId||!qty||!price)return alert('Completá producto y precio');
  const vr=S.vr.find(x=>x.id===varId),gr=S.sg.find(x=>x.id===vr?.group_id);
  const nombre=(gr?gr.name+' › ':'')+vr?.name;
  ticketItems.push({varId,groupId:vr?.group_id,nombre,qty,kpu,price,desc,total:qty*price*(1-desc/100),stockUsed:qty*kpu,unit:gr?.unit||'kg'});
  document.getElementById('tk-qty').value='1';document.getElementById('tk-desc').value='';
  render();
}
function rmTKItem(i){ticketItems.splice(i,1);render();}
function cancelarTicket(){if(!ticketItems.length)return;if(!confirm('¿Cancelar el ticket en proceso?'))return;ticketItems=[];pagoSeleccionado='Efectivo';render();}
function selPago(tipo){
  pagoSeleccionado=tipo;
  const ef=document.getElementById('pago-btn-ef'),tr=document.getElementById('pago-btn-tr'),mix=document.getElementById('pago-btn-mix');
  const mixFields=document.getElementById('tk-mixto-fields');
  const mpField=document.getElementById('tk-mp-field');
  const resetBtn=b=>{if(b){b.style.borderColor='var(--br2)';b.style.background='var(--sf2)';b.style.color='var(--tx2)';}};
  [ef,tr,mix].forEach(resetBtn);
  if(tipo==='Efectivo'&&ef){ef.style.borderColor='var(--gn)';ef.style.background='rgba(74,222,128,.12)';ef.style.color='var(--gn)';}
  else if(tipo==='Transferencia'&&tr){tr.style.borderColor='var(--bl)';tr.style.background='rgba(96,165,250,.12)';tr.style.color='var(--bl)';}
  else if(tipo==='mixto'&&mix){mix.style.borderColor='var(--ac)';mix.style.background='rgba(232,197,71,.12)';mix.style.color='var(--ac)';}
  if(mixFields)mixFields.style.display=tipo==='mixto'?'block':'none';
  if(mpField)mpField.style.display=tipo!=='Efectivo'?'block':'none';
}
async function cerrarTicket(){
  if(!ticketItems.length)return alert('El ticket está vacío');
  const tot=ticketItems.reduce((s,x)=>s+x.total,0);
  let ef=0,tr=0,pago=pagoSeleccionado;
  if(pagoSeleccionado==='mixto'){
    ef=parseFloat(document.getElementById('tk-pago-ef')?.value)||0;
    tr=parseFloat(document.getElementById('tk-pago-tr')?.value)||0;
    if(ef+tr<tot&&!confirm(`El pago (${$m(ef+tr)}) es menor al total (${$m(tot)}). ¿Continuar?`))return;
  }else if(pagoSeleccionado==='Efectivo'){ef=tot;}
  else{tr=tot;}
  // comision medio digital
  let comision=0,mpLabel='';
  if(tr>0){
    const mpSel=document.getElementById('tk-mp-tipo');
    const mpOpt=mpSel?.options[mpSel.selectedIndex];
    const pct=parseFloat(mpOpt?.dataset?.pct)||0;
    mpLabel=mpOpt?.text||'';
    if(pct>0){comision=Math.round(tr*pct/100*100)/100;}
  }
  const tktId=uid(),time=arTime();
  const rows=ticketItems.map(x=>({id:uid(),day,ticket_id:tktId,variant_id:x.varId,group_id:x.groupId,qty:x.qty,stock_used:x.stockUsed,price_unit:x.price,descuento_pct:x.desc,total:x.total,pago,pago_ef:ef,pago_tr:tr,time}));
  if(!S.ve[day])S.ve[day]=[];S.ve[day].push(...rows);
  // descontar stock
  ticketItems.forEach(x=>{const g=S.sg.find(sg=>sg.id===x.groupId);if(g)g.stock_qty=Math.max(0,(g.stock_qty||0)-x.stockUsed);});
  // registrar comision como gasto automatico
  if(comision>0){
    const gCom={id:uid(),day,descripcion:`Comisión ${mpLabel} (ticket ${time})`,cat:'Comisiones digitales',amount:comision,metodo:'transferencia',auto:true,time};
    if(!S.ga[day])S.ga[day]=[];S.ga[day].push(gCom);
    if(online)sbUp('gastos',gCom).catch(()=>{});
  }
  ticketItems=[];pagoSeleccionado='Efectivo';save();render();toast('Ticket cerrado ✓'+(comision>0?` · Comisión ${$m(comision)} registrada`:''));
  if(online){sync('busy','guardando...');try{
    await sbUp('ventas',rows);
    const changed=[...new Set(rows.map(r=>r.group_id).filter(Boolean))];
    for(const gid of changed){const g=S.sg.find(x=>x.id===gid);if(g)await sbUp('stock_groups',{id:g.id,name:g.name,unit:g.unit,tipo:g.tipo,stock_qty:g.stock_qty,cost_unit:g.cost_unit||0});}
    sync('ok','guardado');
  }catch(e){sync('err','error')}}
}
async function delTicket(tid){
  if(!confirm('¿Eliminar este ticket? Se revertirá el stock.'))return;
  const vs=S.ve[day]||[],items=vs.filter(v=>(v.ticket_id||v.id)===tid);
  items.forEach(v=>{const g=S.sg.find(x=>x.id===v.group_id);if(g)g.stock_qty=(g.stock_qty||0)+(v.stock_used||0);});
  S.ve[day]=vs.filter(v=>(v.ticket_id||v.id)!==tid);save();render();
  if(online){for(const v of items){try{await sbDel('ventas',v.id);}catch(e){}}
    const changed=[...new Set(items.map(v=>v.group_id).filter(Boolean))];
    for(const gid of changed){const g=S.sg.find(x=>x.id===gid);if(g){try{await sbUp('stock_groups',{id:g.id,name:g.name,unit:g.unit,tipo:g.tipo,stock_qty:g.stock_qty,cost_unit:g.cost_unit||0})}catch(e){}}}
  }
}

/* Movimientos de caja */
async function addMov(){
  const tipo=document.getElementById('mov-tipo').value,desc=document.getElementById('mov-desc').value.trim(),monto=parseFloat(document.getElementById('mov-monto').value)||0,metodo=document.getElementById('mov-metodo').value;
  if(!desc||!monto)return alert('Completá descripción y monto');
  const row={id:uid(),day,tipo,descripcion:desc,metodo,monto,time:arTime()};
  if(!S.caja[day])S.caja[day]=[];S.caja[day].push(row);save();render();
  if(online){sync('busy','guardando...');try{await sbUp('caja_movimientos',row);sync('ok','guardado')}catch(e){sync('err','error')}}
}
async function delMov(id){S.caja[day]=(S.caja[day]||[]).filter(x=>x.id!==id);save();render();if(online){try{await sbDel('caja_movimientos',id)}catch(e){}}}

/* Cierre de caja */
function calcCierre(){
  let total=0;
  BILLETES.forEach(b=>{const q=parseInt(document.getElementById('bill_'+b)?.value)||0,sub=q*b;total+=sub;const el=document.getElementById('bsub_'+b);if(el)el.textContent=sub>0?$m(sub):'';});
  const retiro=parseFloat(document.getElementById('cierre-retiro')?.value)||0;
  const totEl=document.getElementById('cierre-total'),saldoEl=document.getElementById('cierre-saldo');
  if(totEl)totEl.textContent=$m(total);
  if(saldoEl)saldoEl.value=$m(Math.max(0,total-retiro));
  // actualizar cuenta del día
  const deberiaEl=document.getElementById('cierre-deberia'),contEl=document.getElementById('cierre-contado-disp'),difEl=document.getElementById('cierre-diferencia'),retDisp=document.getElementById('cierre-retiro-display');
  if(retDisp)retDisp.textContent='-'+$m(retiro);
  if(deberiaEl){
    const vs=dV(),ef=vs.filter(v=>v.pago==='Efectivo'||v.pago_ef>0).reduce((s,v)=>s+(v.pago==='Efectivo'?v.total:(v.pago_ef||0)),0);
    const compraGastoIds=new Set(S.co.map(c=>c.gasto_id).filter(Boolean));
    const gaEf=(S.ga[day]||[]).filter(g=>!compraGastoIds.has(g.id)&&g.metodo!=='transferencia').reduce((s,g)=>s+g.amount,0);
    const prevDay=getPrevDay(day);
    const fondoBase=S.cierres?.[prevDay]?.saldo_siguiente||0;
    const cb=document.getElementById('cierre-editar-fondo');
    const fondoManualInp=document.getElementById('cierre-fondo-manual');
    const fondo=cb?.checked&&fondoManualInp?( parseFloat(fondoManualInp.value)||0 ):fondoBase;
    // actualizar la línea de fondo en la cuenta
    const fondoCuenta=document.getElementById('cierre-fondo-cuenta');
    if(fondoCuenta)fondoCuenta.textContent='+'+$m(fondo);
    const deberia=fondo+ef-gaEf-retiro;
    deberiaEl.textContent=$m(deberia);
    if(contEl)contEl.textContent=$m(Math.max(0,total-retiro));
    if(difEl){const dif=Math.max(0,total-retiro)-deberia;difEl.textContent=(dif>=0?'+':'')+$m(dif);difEl.style.color=Math.abs(dif)<50?'var(--gn)':dif>0?'var(--ac)':'var(--rd)';}
  }
}
function toggleFondoEdit(){
  const cb=document.getElementById('cierre-editar-fondo');
  const inp=document.getElementById('cierre-fondo-manual');
  const disp=document.getElementById('cierre-fondo-display');
  if(inp)inp.style.display=cb?.checked?'block':'none';
  if(disp)disp.style.display=cb?.checked?'none':'inline';
  calcCierre();
}
function saveCierre(){
  let total=0;const detalle={};
  BILLETES.forEach(b=>{const q=parseInt(document.getElementById('bill_'+b)?.value)||0;detalle[b]=q;total+=q*b;});
  const retiro=parseFloat(document.getElementById('cierre-retiro')?.value)||0;
  const saldo=Math.max(0,total-retiro);
  if(total===0)return alert('Contá al menos un billete');
  const cb=document.getElementById('cierre-editar-fondo');
  const fondoManualVal=cb?.checked?parseFloat(document.getElementById('cierre-fondo-manual')?.value)||0:undefined;
  if(!S.cierres)S.cierres={};
  S.cierres[day]={total_contado:total,detalle,retiro,saldo_siguiente:saldo,fondo_inicial_manual:fondoManualVal,time:arTime()};
  save();render();toast('Cierre guardado ✓ — Fondo siguiente: '+$m(saldo));
}

/* Gastos */
async function addGa(){const d2=document.getElementById('g-d').value.trim(),c=document.getElementById('g-c').value,a=parseFloat(document.getElementById('g-a').value)||0,met=document.getElementById('g-met')?.value||'efectivo';if(!d2||!a)return alert('Completá descripción y monto');const row={id:uid(),day,descripcion:d2,cat:c,amount:a,metodo:met,time:arTime()};if(!S.ga[day])S.ga[day]=[];S.ga[day].push(row);save();render();if(online){sync('busy','guardando...');try{await sbUp('gastos',row);sync('ok','guardado')}catch(e){sync('err','error')}}}
async function delGa(id){S.ga[day]=(S.ga[day]||[]).filter(x=>x.id!==id);save();render();if(online){try{await sbDel('gastos',id)}catch(e){}}}
function addGasCat(){const n=document.getElementById('gascat-n')?.value.trim();if(!n)return;if((S.cfg.gasCats||[]).includes(n))return alert('Ya existe');if(!S.cfg.gasCats)S.cfg.gasCats=[];S.cfg.gasCats.push(n);save();render();toast('Categoría agregada ✓');}
function delGasCat(i){if(!confirm('¿Eliminar esta categoría?'))return;S.cfg.gasCats.splice(i,1);save();render();}
function rGastos(){
  const gs=dG(),tot=gs.reduce((s,g)=>s+g.amount,0);
  const cats={};gs.forEach(g=>{cats[g.cat]=(cats[g.cat]||0)+g.amount});
  const cH=Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--br)"><span style="font-size:11px;color:var(--tx2)">${c}</span><span style="font-family:var(--mo);font-size:12px">${$m(v)}</span></div>`).join('');
  const catOpts=(S.cfg.gasCats||[]).map(c=>`<option>${esc(c)}</option>`).join('');
  const rows=gs.length?gs.map(g=>`<tr><td>${g.time||''}</td><td style="max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(g.descripcion)}</td><td><span class="tag tg">${(g.cat||'').slice(0,5)}</span></td><td>${$m(g.amount)}</td><td><button class="dbtn" onclick="delGa('${g.id}')">✕</button></td></tr>`).join(''):`<tr><td colspan="5" class="empty-row">Sin gastos</td></tr>`;
  const catListRows=(S.cfg.gasCats||[]).map((c,i)=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--br)"><span style="font-size:11px">${esc(c)}</span><button class="dbtn" onclick="delGasCat(${i})">✕</button></div>`).join('');
  return`<div class="kpis"><div class="kc hi"><div class="kl">Total gastos</div><div class="kv r">${$m(tot)}</div><div class="kh">${gs.length} registros</div></div></div>
  ${Object.keys(cats).length?`<div class="blk"><div class="bt">Por categoría</div>${cH}</div>`:''}
  <div class="blk"><div class="bt">Registrar gasto</div>
    <div class="fr"><div class="fl" style="flex:2"><label>Descripción</label><input type="text" id="g-d" placeholder="Ej: Gas, bolsas, personal..."></div><div class="fl"><label>Categoría</label><select id="g-c">${catOpts}</select></div></div>
    <div class="fr"><div class="fl"><label>Monto $</label><input type="number" id="g-a" placeholder="0"></div><button class="btn btnp" onclick="addGa()" style="align-self:flex-end">+ Gasto</button></div>
  </div>
  <div class="tbk"><div class="tt">Gastos del día</div>
    <table><thead><tr><th>Hora</th><th>Descripción</th><th>Cat.</th><th>Monto</th><th></th></tr></thead><tbody>${rows}</tbody></table>
  </div>
  ${sesion?.rol==='dueno'?`<div class="blk"><div class="bt">Gestionar categorías de gastos</div>
    <div style="margin-bottom:10px">${catListRows||'<div style="font-size:11px;color:var(--tx3)">Sin categorías</div>'}</div>
    <div class="fr"><div class="fl" style="flex:2"><label>Nueva categoría</label><input type="text" id="gascat-n" placeholder="Ej: Mantenimiento, Publicidad..."></div><button class="btn btnp" onclick="addGasCat()" style="align-self:flex-end">+ Agregar</button></div>
  </div>`:''}`;
}

/* ══ STOCK ══════════════════════════════════════════════════════ */
function rStock(){
  const low=sgV().filter(g=>(g.stock_qty||0)<2);
  const alrt=low.length?`<div class="alrt">⚠ Stock bajo: ${low.map(g=>esc(g.name)+' ('+fQ(g.stock_qty,g.unit)+')').join(', ')}</div>`:'';
  const uOpts=UNITS.map(u=>`<option>${u}</option>`).join('');
  const sgRows=tipo=>S.sg.filter(g=>(g.tipo||'venta')===tipo).map(g=>{
    const max=Math.max(...S.sg.filter(x=>(x.tipo||'venta')===tipo).map(x=>x.stock_qty||0),1),pct=Math.min(100,Math.round(((g.stock_qty||0)/max)*100));
    const col=(g.stock_qty||0)<2?'var(--rd)':(g.stock_qty||0)<5?'var(--or)':'var(--gn)';
    return`<tr><td><div style="font-size:12px">${esc(g.name)} <span style="font-size:9px;color:var(--tx3)">${g.unit||'kg'}</span></div>
      ${tipo==='venta'?`<div style="font-size:9px;color:var(--tx3)">${S.vr.filter(v=>v.group_id===g.id).map(v=>esc(v.name)).join(', ')||'sin variantes'}</div>`:''}
      <div class="sb-w"><div class="sb" style="width:${pct}%;background:${col}"></div></div></td>
      <td style="color:${col};font-family:var(--mo);font-weight:500">${fQ(g.stock_qty,g.unit)}</td>
      <td><input type="number" class="ip" value="${+(g.stock_qty||0).toFixed(3)}" step="0.1" min="0" onchange="updGS('${g.id}',this.value)"></td>
      ${tipo==='produccion'?`<td><input type="number" class="ip" value="${+(g.cost_unit||0).toFixed(2)}" step="0.01" min="0" onchange="updGCost('${g.id}',this.value)"></td>`:'<td></td>'}
      <td><button class="dbtn" onclick="delG('${g.id}')">✕</button></td>
    </tr>`;
  }).join('')||`<tr><td colspan="5" class="empty-row">Sin grupos</td></tr>`;
  const vrRows=sgV().map(g=>{const vars=S.vr.filter(v=>v.group_id===g.id);if(!vars.length)return'';
    return`<tr style="background:rgba(255,255,255,.01)"><td colspan="4" style="padding:5px 12px;font-size:9px;color:var(--tx3);text-transform:uppercase;letter-spacing:.5px;border-top:1px solid var(--br)">${esc(g.name)} (${g.unit||'kg'})</td></tr>`
      +vars.map(v=>`<tr><td style="padding-left:18px">${esc(v.name)}</td><td style="color:var(--tx3);font-size:10px">−${v.qty_per_unit} ${g.unit||'kg'}/u</td><td><input type="number" class="ip" value="${v.price||0}" onchange="updVP('${v.id}',this.value)"></td><td><button class="dbtn" onclick="delVr('${v.id}')">✕</button></td></tr>`).join('');
  }).join('');
  const grOptV=sgV().map(g=>`<option value="${g.id}">${esc(g.name)} (${g.unit||'kg'})</option>`).join('');
  return`${alrt}
  <div class="sh">Stock de venta</div>
  <div class="blk"><div class="bt">Nuevo grupo de venta</div>
    <div class="fr"><div class="fl" style="flex:2"><label>Nombre</label><input type="text" id="sg-n" placeholder="Ej: Cuartos, Supremas, Milanesas..."></div><div class="fl" style="max-width:90px"><label>Unidad</label><select id="sg-u">${uOpts}</select></div><div class="fl" style="max-width:70px"><label>Stock inicial</label><input type="number" id="sg-s" placeholder="0" step="0.1"></div></div>
    <button class="btn btnp" onclick="addG('venta')" style="width:100%;margin-top:4px">+ Crear grupo</button>
  </div>
  <div class="tbk"><div class="tt">Stock de venta</div>
    <table><thead><tr><th>Grupo</th><th>Stock</th><th>Ajustar</th><th></th><th></th></tr></thead><tbody>${sgRows('venta')}</tbody></table>
  </div>
  <div class="sh">Variantes de venta</div>
  <div class="blk"><div class="bt">Nueva variante</div>
    <div class="fr"><div class="fl"><label>Grupo</label><select id="vr-g">${grOptV||'<option>Sin grupos</option>'}</select></div><div class="fl" style="flex:2"><label>Nombre</label><input type="text" id="vr-n" placeholder="Ej: Cuarto x kg, Oferta 3kg, Pata..."></div></div>
    <div class="fr"><div class="fl"><label>Cantidad que descuenta</label><input type="number" id="vr-k" placeholder="1" min="0.001" step="0.001"></div><div class="fl"><label>Precio $</label><input type="number" id="vr-p" placeholder="0"></div><button class="btn btnp" onclick="addVr()" style="align-self:flex-end">+ Crear</button></div>
  </div>
  <div class="tbk"><div class="tt">Variantes — editá precio directo</div>
    <table><thead><tr><th>Variante</th><th>Descuenta</th><th>Precio $</th><th></th></tr></thead><tbody>${vrRows||`<tr><td colspan="4" class="empty-row">Sin variantes</td></tr>`}</tbody></table>
  </div>
  ${sesion?.rol==='dueno'?`
  <div class="sh">Configuración de comisiones digitales</div>
  <div class="blk">
    <div style="font-size:10px;color:var(--tx2);font-family:var(--mo);margin-bottom:10px">Los porcentajes se aplican automáticamente al monto en transferencia de cada ticket. Podés editarlos según los acuerdos vigentes con cada medio de pago.</div>
    <table style="width:100%"><thead><tr><th>Medio</th><th>% comisión</th><th></th></tr></thead><tbody>
      ${(S.cfg.mp||[]).map((m,i)=>`<tr>
        <td style="font-size:11px">${esc(m.label)}</td>
        <td><input type="number" class="ip" value="${m.pct}" step="0.01" min="0" max="100" onchange="updMPPct(${i},this.value)" style="width:60px"></td>
        <td><button class="dbtn" onclick="delMPItem(${i})">✕</button></td>
      </tr>`).join('')}
    </tbody></table>
    <div class="fr" style="margin-top:10px">
      <div class="fl" style="flex:2"><label>Nuevo medio</label><input type="text" id="mp-label" placeholder="Ej: MODO, Naranja X..."></div>
      <div class="fl" style="max-width:80px"><label>% comisión</label><input type="number" id="mp-pct" placeholder="3.5" step="0.01" min="0"></div>
      <button class="btn btnp" onclick="addMPItem()" style="align-self:flex-end">+ Agregar</button>
    </div>
  </div>`:''}`;
}
async function addG(tipo){
  const n=document.getElementById(tipo==='produccion'?'sgp-n':'sg-n')?.value.trim(),u=document.getElementById(tipo==='produccion'?'sgp-u':'sg-u')?.value||'kg',s=parseFloat(document.getElementById(tipo==='produccion'?'sgp-s':'sg-s')?.value)||0;
  if(!n)return alert('Ingresá un nombre');if(S.sg.find(g=>g.name===n&&(g.tipo||'venta')===tipo))return alert('Ya existe');
  const row={id:uid(),name:n,unit:u,stock_qty:s,tipo,cost_unit:0};S.sg.push(row);save();render();
  if(online){try{await sbUp('stock_groups',row);sync('ok','guardado')}catch(e){sync('err','error')}}
}
async function updGS(id,v){const g=S.sg.find(x=>x.id===id);if(!g)return;g.stock_qty=parseFloat(v)||0;save();toast('Stock actualizado ✓');if(online){try{await sbUp('stock_groups',{id:g.id,name:g.name,unit:g.unit,tipo:g.tipo,stock_qty:g.stock_qty,cost_unit:g.cost_unit||0});sync('ok','guardado')}catch(e){sync('err','error')}}}
async function updGCost(id,v){const g=S.sg.find(x=>x.id===id);if(!g)return;g.cost_unit=parseFloat(v)||0;save();toast('Costo actualizado ✓');if(online){try{await sbUp('stock_groups',{id:g.id,name:g.name,unit:g.unit,tipo:g.tipo,stock_qty:g.stock_qty,cost_unit:g.cost_unit});sync('ok','guardado')}catch(e){sync('err','error')}}}
async function delG(id){if(!confirm('¿Eliminar grupo?'))return;S.sg=S.sg.filter(x=>x.id!==id);S.vr=S.vr.filter(x=>x.group_id!==id);save();render();if(online){try{await sbDel('stock_groups',id)}catch(e){}}}
async function addVr(){const gid=document.getElementById('vr-g').value,n=document.getElementById('vr-n').value.trim(),k=parseFloat(document.getElementById('vr-k').value)||0,p=parseFloat(document.getElementById('vr-p').value)||0;if(!gid||!n||!k)return alert('Completá todos los campos');const row={id:uid(),group_id:gid,name:n,qty_per_unit:k,price:p};S.vr.push(row);save();render();if(online){try{await sbUp('stock_variants',row);sync('ok','guardado')}catch(e){sync('err','error')}}}
async function updVP(id,v){const vr=S.vr.find(x=>x.id===id);if(!vr)return;vr.price=parseFloat(v)||0;save();toast('Precio actualizado ✓');if(online){try{await sbUp('stock_variants',{id:vr.id,group_id:vr.group_id,name:vr.name,qty_per_unit:vr.qty_per_unit,price:vr.price});sync('ok','guardado')}catch(e){sync('err','error')}}}
async function delVr(id){S.vr=S.vr.filter(x=>x.id!==id);save();render();if(online){try{await sbDel('stock_variants',id)}catch(e){}}}

function updMPPct(i,v){if(!S.cfg.mp[i])return;S.cfg.mp[i].pct=parseFloat(v)||0;save();toast('Comisión actualizada ✓');}
function delMPItem(i){if(!confirm('¿Eliminar este medio?'))return;S.cfg.mp.splice(i,1);save();render();}
function addMPItem(){const lbl=document.getElementById('mp-label')?.value.trim(),pct=parseFloat(document.getElementById('mp-pct')?.value)||0;if(!lbl)return alert('Ingresá el nombre del medio');S.cfg.mp.push({id:uid(),label:lbl,pct});save();render();toast('Medio agregado ✓');}

/* ══ PRODUCCIÓN ══════════════════════════════════════════════════════ */
function rProd(){
  return`<div class="prod-tabs">
    <button class="prod-tab ${prodTab==='corte'?'active':''}" onclick="setProdTab('corte')">✂ Corte — Ingreso stock</button>
    <button class="prod-tab ${prodTab==='elab'?'active':''}" onclick="setProdTab('elab')">🍳 Elaboración</button>
  </div>
  ${prodTab==='corte'?rCorte():rElab()}`;
}
function setProdTab(t){prodTab=t;render();}

function rCorte(){
  const todC=S.ct.filter(c=>c.day===day);
  const sgVOpts=sgV().map(g=>`<option value="${g.id}" data-u="${g.unit||'kg'}">${esc(g.name)} (${g.unit||'kg'})</option>`).join('');
  const cards=todC.length?todC.map(c=>{const items=S.cti.filter(i=>i.corte_id===c.id);return`<div class="lote-card"><div class="lote-card-header"><div><div style="font-size:13px;font-weight:600">${esc(c.nombre)}</div><div style="font-size:10px;color:var(--tx3);font-family:var(--mo)">${c.time||''}</div></div><button class="dbtn" onclick="delCorte('${c.id}')">✕</button></div>${items.length?`<div class="lote-card-items">${items.map(i=>`<div style="font-size:10px;color:var(--tx2);padding:2px 0">+ ${fQ(i.qty,i.unit)} → ${esc(i.nombre)}</div>`).join('')}</div>`:''}</div>`;}).join(''):`<div class="empty-row">Sin cortes hoy</div>`;
  return`<div class="info-box green">✂ Ingresá los kg de cada corte. Se suman al stock de venta sin agregar costos.</div>
  <div class="blk"><div class="bt">Nuevo corte</div>
    <div class="fr"><div class="fl" style="flex:2"><label>Nombre</label><input type="text" id="ct-n" placeholder="Ej: Corte mañana, Tanda 1..."></div><div class="fl"><label>Nota</label><input type="text" id="ct-note" placeholder="opcional"></div></div>
  </div>
  <div class="blk"><div class="bt">Cortes obtenidos</div>
    <div id="corte-items-list"></div>
    <div class="fr" style="margin-top:8px"><div class="fl" style="flex:2"><label>Grupo de stock</label><select id="ci-grp">${sgVOpts||'<option>Sin grupos</option>'}</select></div><div class="fl" style="max-width:70px"><label>Cantidad</label><input type="number" id="ci-qty" placeholder="0" min="0.01" step="0.01"></div><button class="btn" onclick="addCorteItem()" style="align-self:flex-end;padding:6px 10px;font-size:11px">+</button></div>
    <button class="btn btnp" onclick="saveCorte()" style="width:100%;margin-top:8px">✓ Guardar corte</button>
  </div>
  <div class="sh">Cortes de hoy</div>${cards}`;
}
function renderCorteItems(){
  const list=document.getElementById('corte-items-list');if(!list)return;
  if(!corteItems.length){list.innerHTML=`<div style="font-size:11px;color:var(--tx3);font-family:var(--mo);padding:4px 0">Sin cortes agregados</div>`;return;}
  list.innerHTML=corteItems.map((x,i)=>`<div class="pvi"><div><div class="pvn">${esc(x.nombre)} <span class="tag tv">+${fQ(x.qty,x.unit)}</span></div></div><button class="dbtn" onclick="rmCorteItem(${i})">✕</button></div>`).join('');
}
function addCorteItem(){const sel=document.getElementById('ci-grp'),opt=sel?.options[sel.selectedIndex],gid=sel?.value,qty=parseFloat(document.getElementById('ci-qty')?.value)||0;if(!gid||!qty)return alert('Seleccioná grupo y cantidad');const g=S.sg.find(x=>x.id===gid);corteItems.push({group_id:gid,nombre:g?g.name:gid,qty,unit:opt?.dataset?.u||g?.unit||'kg'});document.getElementById('ci-qty').value='';renderCorteItems();}
function rmCorteItem(i){corteItems.splice(i,1);renderCorteItems();}
async function saveCorte(){
  const nom=document.getElementById('ct-n')?.value.trim(),note=document.getElementById('ct-note')?.value.trim();
  if(!nom)return alert('Ingresá un nombre');if(!corteItems.length)return alert('Agregá al menos un corte');
  const cId=uid(),corte={id:cId,day,nombre:nom,note:note||null,time:arTime()};
  const items=corteItems.map(x=>({id:uid(),corte_id:cId,group_id:x.group_id,nombre:x.nombre,qty:x.qty,unit:x.unit}));
  items.forEach(x=>{const g=S.sg.find(sg=>sg.id===x.group_id);if(g)g.stock_qty=(g.stock_qty||0)+x.qty;});
  S.ct.push(corte);S.cti.push(...items);corteItems=[];save();render();
  if(online){sync('busy','guardando...');try{await sbUp('cortes',corte);if(items.length)await sbUp('cortes_items',items);const ch=[...new Set(items.map(x=>x.group_id))];for(const gid of ch){const g=S.sg.find(x=>x.id===gid);if(g)await sbUp('stock_groups',{id:g.id,name:g.name,unit:g.unit,tipo:g.tipo,stock_qty:g.stock_qty,cost_unit:g.cost_unit||0});}sync('ok','guardado');}catch(e){sync('err','error')}}
}
async function delCorte(id){
  if(!confirm('¿Eliminar? Se revertirá el stock.'))return;
  const items=S.cti.filter(x=>x.corte_id===id);
  items.forEach(x=>{const g=S.sg.find(sg=>sg.id===x.group_id);if(g)g.stock_qty=Math.max(0,(g.stock_qty||0)-x.qty);});
  S.ct=S.ct.filter(x=>x.id!==id);S.cti=S.cti.filter(x=>x.corte_id!==id);save();render();
  if(online){try{await sbDel('cortes',id);const ch=[...new Set(items.map(x=>x.group_id))];for(const gid of ch){const g=S.sg.find(x=>x.id===gid);if(g)await sbUp('stock_groups',{id:g.id,name:g.name,unit:g.unit,tipo:g.tipo,stock_qty:g.stock_qty,cost_unit:g.cost_unit||0});}}catch(e){}}
}

function rElab(){
  const todE=S.el.filter(e=>e.day===day);
  const sgVOpts=sgV().map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join('');
  const insOpts=S.ins.map(i=>`<option value="${i.id}" data-cu="${i.costUnit||0}" data-u="${i.unit}">${esc(i.name)} (${$d2(i.costUnit||0)}/${i.unit})</option>`).join('');
  const allStOpts=sgV().map(g=>`<option value="sg_${g.id}" data-cu="${g.cost_unit||0}" data-u="${g.unit||'kg'}">${esc(g.name)} (costo: ${$d2(g.cost_unit||0)}/${g.unit||'kg'})</option>`).join('');
  const cards=todE.length?todE.map(e=>{const outG=S.sg.find(x=>x.id===e.output_group_id),items=S.eli.filter(i=>i.elaboracion_id===e.id);return`<div class="lote-card"><div class="lote-card-header"><div><div style="font-size:13px;font-weight:600">${esc(e.nombre)}</div><div style="font-size:10px;color:var(--tx3);font-family:var(--mo)">${e.time||''}${outG?' → '+outG.name+' +'+fQ(e.output_qty,outG.unit):''}</div></div><div style="text-align:right"><div style="font-size:11px;font-family:var(--mo);color:var(--tx2)">Costo ref.: ${$m(e.costo_total_info||0)}</div><button class="dbtn" onclick="delElab('${e.id}')" style="margin-top:3px">✕</button></div></div>${items.length?`<div class="lote-card-items">${items.map(i=>`<div style="font-size:10px;color:var(--tx2);padding:2px 0">−${fQ(i.qty,i.unit)} ${esc(i.nombre)} — ref. ${$m(i.costo_subtotal||0)}</div>`).join('')}</div>`:''}</div>`;}).join(''):`<div class="empty-row">Sin elaboraciones hoy</div>`;
  return`<div class="info-box amber">🍳 Los costos son <strong>solo referenciales</strong>. No generan gastos — ya están en las facturas de compra.</div>
  <div class="blk"><div class="bt">Nuevo lote de elaboración</div>
    <div class="fr"><div class="fl" style="flex:2"><label>Nombre</label><input type="text" id="el-n" placeholder="Ej: Milanesas tarde..."></div><div class="fl"><label>Nota</label><input type="text" id="el-note" placeholder=""></div></div>
    <div class="fr"><div class="fl" style="flex:2"><label>Resultado → ingresa a stock de venta</label><select id="el-outg"><option value="">No ingresa</option>${sgVOpts}</select></div><div class="fl" style="max-width:80px"><label>Cantidad</label><input type="number" id="el-outqty" placeholder="0" step="0.01"></div></div>
  </div>
  <div class="blk"><div class="bt">Ingredientes (descuenta stock)</div>
    <div id="elab-items-list"></div>
    <div class="fr" style="margin-top:8px">
      <div class="fl" style="max-width:100px"><label>Tipo</label><select id="eli-tipo" onchange="onElabTipo()"><option value="stock">Stock venta</option><option value="insumo">Insumo</option></select></div>
      <div class="fl" style="flex:2"><label>Item</label><select id="eli-item">${allStOpts||'<option>Sin grupos</option>'}</select></div>
      <div class="fl" style="max-width:65px"><label>Cant.</label><input type="number" id="eli-qty" placeholder="0" min="0.001" step="0.001"></div>
      <button class="btn" onclick="addElabItem()" style="align-self:flex-end;padding:6px 10px;font-size:11px">+</button>
    </div>
    <button class="btn btnp" onclick="saveElab()" style="width:100%;margin-top:8px">✓ Guardar elaboración</button>
  </div>
  <div class="sh">Elaboraciones de hoy</div>${cards}
  <div class="sh">Insumos</div>${rInsumosBlk()}`;
}
function onElabTipo(){const t=document.getElementById('eli-tipo')?.value,s=document.getElementById('eli-item');if(!s)return;if(t==='stock')s.innerHTML=sgV().map(g=>`<option value="sg_${g.id}" data-cu="${g.cost_unit||0}" data-u="${g.unit||'kg'}">${esc(g.name)} (costo: ${$d2(g.cost_unit||0)}/${g.unit||'kg'})</option>`).join('')||'<option>Sin grupos</option>';else s.innerHTML=S.ins.map(i=>`<option value="ins_${i.id}" data-cu="${i.costUnit||0}" data-u="${i.unit}">${esc(i.name)} (${$d2(i.costUnit||0)}/${i.unit})</option>`).join('')||'<option>Sin insumos</option>';}
function renderElabItems(){
  const list=document.getElementById('elab-items-list');if(!list)return;
  if(!elabItems.length){list.innerHTML=`<div style="font-size:11px;color:var(--tx3);font-family:var(--mo);padding:4px 0">Sin ingredientes</div>`;return;}
  const cT=elabItems.reduce((s,x)=>s+x.costo_subtotal,0);
  list.innerHTML=elabItems.map((x,i)=>`<div class="pvi"><div><div class="pvn">${esc(x.nombre)} <span class="tag ${x.tipo==='stock'?'tp':'tc'}">${x.tipo}</span></div><div class="pvd">−${fQ(x.qty,x.unit)} × ${$d2(x.costo_unit)} = ${$m(x.costo_subtotal)} <span style="color:var(--tx3)">(ref.)</span></div></div><button class="dbtn" onclick="rmElabItem(${i})">✕</button></div>`).join('')
    +`<div style="text-align:right;font-size:12px;font-family:var(--mo);color:var(--tx2);padding:6px 0;border-top:1px solid var(--br);margin-top:4px">Costo ref. total: ${$m(cT)}</div>`;
}
function addElabItem(){
  const tipo=document.getElementById('eli-tipo')?.value,sel=document.getElementById('eli-item'),opt=sel?.options[sel.selectedIndex],val=sel?.value,qty=parseFloat(document.getElementById('eli-qty')?.value)||0;
  if(!val||!qty)return alert('Seleccioná item y cantidad');
  const cu=parseFloat(opt?.dataset?.cu)||0,unit=opt?.dataset?.u||'kg';
  let nombre='',ref_id='';
  if(tipo==='stock'){ref_id=val.replace('sg_','');const g=S.sg.find(x=>x.id===ref_id);nombre=g?g.name:ref_id;}
  else{ref_id=val.replace('ins_','');const i=S.ins.find(x=>x.id===ref_id);nombre=i?i.name:ref_id;}
  elabItems.push({tipo,ref_id,nombre,qty,unit,costo_unit:cu,costo_subtotal:qty*cu});
  document.getElementById('eli-qty').value='';renderElabItems();
}
function rmElabItem(i){elabItems.splice(i,1);renderElabItems();}
async function saveElab(){
  const nom=document.getElementById('el-n')?.value.trim(),note=document.getElementById('el-note')?.value.trim(),outGid=document.getElementById('el-outg')?.value,outQty=parseFloat(document.getElementById('el-outqty')?.value)||0;
  if(!nom)return alert('Ingresá un nombre');if(!elabItems.length)return alert('Agregá al menos un ingrediente');
  const costoInfo=elabItems.reduce((s,x)=>s+x.costo_subtotal,0);
  const eId=uid(),elab={id:eId,day,nombre:nom,output_group_id:outGid||null,output_qty:outQty,costo_total_info:costoInfo,note:note||null,time:arTime()};
  const items=elabItems.map(x=>({id:uid(),elaboracion_id:eId,tipo:x.tipo,ref_id:x.ref_id,nombre:x.nombre,qty:x.qty,unit:x.unit,costo_unit:x.costo_unit,costo_subtotal:x.costo_subtotal}));
  items.forEach(x=>{
    if(x.tipo==='stock'){const g=S.sg.find(sg=>sg.id===x.ref_id);if(g)g.stock_qty=Math.max(0,(g.stock_qty||0)-x.qty);}
    else if(x.tipo==='insumo'){const ins=S.ins.find(i=>i.id===x.ref_id);if(ins)ins.stock_qty=Math.max(0,(ins.stock_qty||0)-x.qty);}
  });
  if(outGid&&outQty>0){const og=S.sg.find(x=>x.id===outGid);if(og)og.stock_qty=(og.stock_qty||0)+outQty;}
  S.el.push(elab);S.eli.push(...items);elabItems=[];save();render();
  if(online){sync('busy','guardando...');try{await sbUp('elaboraciones',{id:elab.id,day:elab.day,nombre:elab.nombre,output_group_id:elab.output_group_id,output_qty:elab.output_qty,costo_total_info:elab.costo_total_info,note:elab.note,time:elab.time});if(items.length)await sbUp('elaboraciones_items',items);const ch=[...new Set([...(outGid?[outGid]:[]),...items.filter(x=>x.tipo==='stock').map(x=>x.ref_id)])];for(const gid of ch){const g=S.sg.find(x=>x.id===gid);if(g)await sbUp('stock_groups',{id:g.id,name:g.name,unit:g.unit,tipo:g.tipo,stock_qty:g.stock_qty,cost_unit:g.cost_unit||0});}sync('ok','guardado');}catch(e){sync('err','error')}}
}
async function delElab(id){
  if(!confirm('¿Eliminar? Se revertirá el stock.'))return;
  const elab=S.el.find(x=>x.id===id);
  if(elab){const items=S.eli.filter(x=>x.elaboracion_id===id);items.forEach(x=>{if(x.tipo==='stock'){const g=S.sg.find(sg=>sg.id===x.ref_id);if(g)g.stock_qty=(g.stock_qty||0)+x.qty;}else if(x.tipo==='insumo'){const ins=S.ins.find(i=>i.id===x.ref_id);if(ins)ins.stock_qty=(ins.stock_qty||0)+x.qty;}});if(elab.output_group_id&&elab.output_qty){const og=S.sg.find(x=>x.id===elab.output_group_id);if(og)og.stock_qty=Math.max(0,(og.stock_qty||0)-elab.output_qty);}}
  S.el=S.el.filter(x=>x.id!==id);S.eli=S.eli.filter(x=>x.elaboracion_id!==id);save();render();
  if(online){try{await sbDel('elaboraciones',id);}catch(e){}}
}

function rInsumosBlk(){
  const rows=S.ins.length?S.ins.map(i=>`<tr><td>${esc(i.name)}</td><td style="color:${(i.stock_qty||0)<1?'var(--or)':'var(--tx)'};font-family:var(--mo)">${fQ(i.stock_qty||0,i.unit)}</td><td><input type="number" class="ip" value="${i.costUnit||0}" onchange="updIns('${i.id}',this.value)"></td><td><button class="dbtn" onclick="delIns('${i.id}')">✕</button></td></tr>`).join(''):`<tr><td colspan="4" class="empty-row">Sin insumos</td></tr>`;
  return`<div class="blk"><div class="bt">Agregar insumo</div>
    <div class="fr"><div class="fl" style="flex:2"><label>Nombre</label><input type="text" id="ins-n" placeholder="Ej: Pan rallado, Rebozador, Aceite..."></div><div class="fl" style="max-width:75px"><label>Unidad</label><select id="ins-u"><option>kg</option><option>litro</option><option>unidad</option><option>bolsa</option></select></div></div>
    <div class="fr"><div class="fl"><label>Costo/unidad $</label><input type="number" id="ins-c" placeholder="0"></div><button class="btn btnp" onclick="addIns()" style="align-self:flex-end">+ Agregar</button></div>
    <div style="font-size:9px;color:var(--tx3);font-family:var(--mo);margin-top:3px">Stock entra desde Compras · Sale desde Elaboración</div>
  </div>
  <div class="tbk"><div class="tt">Insumos — stock y costo</div>
    <table><thead><tr><th>Insumo</th><th>Stock</th><th>Costo $</th><th></th></tr></thead><tbody>${rows}</tbody></table>
  </div>`;
}
async function addIns(){const n=document.getElementById('ins-n')?.value.trim(),u=document.getElementById('ins-u')?.value,c=parseFloat(document.getElementById('ins-c')?.value)||0;if(!n||!c)return alert('Completá nombre y costo');if(S.ins.find(i=>i.name===n))return alert('Ya existe');const row={id:uid(),name:n,unit:u,costUnit:c,cost_unit:c,stock_qty:0};S.ins.push(row);save();render();if(online){try{await sbUp('insumos',{id:row.id,name:row.name,unit:row.unit,cost_unit:row.costUnit});sync('ok','guardado')}catch(e){sync('err','error')}}}
async function updIns(id,v){const i=S.ins.find(x=>x.id===id);if(!i)return;i.costUnit=parseFloat(v)||0;i.cost_unit=i.costUnit;save();toast('Costo actualizado ✓');if(online){try{await sbUp('insumos',{id:i.id,name:i.name,unit:i.unit,cost_unit:i.costUnit});sync('ok','guardado')}catch(e){sync('err','error')}}}
async function delIns(id){S.ins=S.ins.filter(x=>x.id!==id);save();render();if(online){try{await sbDel('insumos',id)}catch(e){}}}

/* ══ COMPRAS ══════════════════════════════════════════════════════ */
function rCompras(){
  const todC=S.co.filter(c=>c.day===day);
  const sgVOpts=sgV().map(g=>`<option value="sgv_${g.id}" data-u="${g.unit||'kg'}">${esc(g.name)} (${g.unit||'kg'})</option>`).join('');
  const insOpts=S.ins.map(i=>`<option value="ins_${i.id}" data-u="${i.unit}">${esc(i.name)} (${i.unit})</option>`).join('');
  const allOpts=`<optgroup label="Stock de venta">${sgVOpts||'<option disabled>Sin grupos</option>'}</optgroup><optgroup label="Insumos">${insOpts||'<option disabled>Sin insumos</option>'}</optgroup>`;
  const propOpts=sgV().map(g=>`<label style="display:flex;align-items:center;gap:5px;padding:4px 0;font-size:11px;cursor:pointer;font-family:var(--mo)"><input type="checkbox" id="prop_${g.id}" value="${g.id}" style="width:auto;accent-color:var(--ac)"> ${esc(g.name)}</label>`).join('');
  const cards=todC.length?todC.map(c=>{const items=S.coi.filter(i=>i.compra_id===c.id);const pi=[];if(c.pago_efectivo>0)pi.push(`Ef: ${$m(c.pago_efectivo)}`);if(c.pago_transferencia>0)pi.push(`Tr: ${$m(c.pago_transferencia)}`);
    return`<div class="lote-card"><div class="lote-card-header"><div><div style="font-size:13px;font-weight:600">${esc(c.proveedor)}</div><div style="font-size:10px;color:var(--tx3);font-family:var(--mo)">${c.time||''}${c.nro_factura?' · F/'+esc(c.nro_factura):''}</div>${pi.length?`<div style="font-size:10px;color:var(--tx2);font-family:var(--mo)">${pi.join(' + ')}</div>`:''}</div><div style="text-align:right"><div style="font-size:13px;font-family:var(--mo);color:var(--ac)">${$m(c.total)}</div><button class="dbtn" onclick="delCompra('${c.id}')" style="margin-top:3px">✕</button></div></div>
    ${items.length?`<div class="lote-card-items">${items.map(i=>`<div style="font-size:10px;color:var(--tx2);padding:2px 0">${esc(i.descripcion)}: ${i.qty_compra} ${i.unit_compra||''} ${i.qty_real?'→ '+fQ(i.qty_real,i.unit_real):''} — ${$m(i.precio_total)}${i.cost_unit_calculado?' ('+$d2(i.cost_unit_calculado)+'/'+i.unit_real+')':''}</div>`).join('')}</div>`:''}
    </div>`;
  }).join(''):`<div class="empty-row">Sin compras hoy</div>`;
  return`<div class="info-box">🛒 Al guardar: actualiza stock y costos, y registra el total como gasto del día.</div>
  <div class="sh">Nueva factura</div>
  <div class="blk"><div class="bt">Datos de la factura</div>
    <div class="fr"><div class="fl" style="flex:2"><label>Proveedor</label><input type="text" id="cp-prov" placeholder="Ej: Avícola Don Juan"></div><div class="fl" style="max-width:110px"><label>Nro. Factura</label><input type="text" id="cp-fact" placeholder="opcional"></div></div>
    <div class="fr"><div class="fl"><label>Nota</label><input type="text" id="cp-note" placeholder=""></div></div>
    <div style="font-size:9px;color:var(--tx2);font-family:var(--mo);margin-bottom:6px;margin-top:4px">FORMA DE PAGO</div>
    <div class="fr"><div class="fl"><label>Efectivo $</label><input type="number" id="cp-ef" placeholder="0" oninput="calcCpTotal()"></div><div class="fl"><label>Transferencia $</label><input type="number" id="cp-tr" placeholder="0" oninput="calcCpTotal()"></div><div class="fl"><label>Total</label><input type="text" id="cp-tot" readonly style="color:var(--ac)"></div></div>
  </div>
  <div class="blk"><div class="bt">Artículos</div>
    <div id="cp-items-list"></div>
    <div class="sep"></div>
    <div style="font-size:9px;color:var(--tx2);font-family:var(--mo);margin-bottom:7px">AGREGAR ARTÍCULO</div>
    <div class="fr"><div class="fl" style="flex:2"><label>Descripción</label><input type="text" id="ci-desc" placeholder="Ej: Cajón pollo, Pan rallado..."></div><div class="fl" style="max-width:110px"><label>Actualiza</label><select id="ci-tipo" onchange="onCiTipo()"><option value="sgv">Stock de venta</option><option value="ins">Insumo</option><option value="otro">Ninguno</option></select></div></div>
    <div class="fr" id="ci-item-row"><div class="fl"><label>Artículo</label><select id="ci-ref">${sgVOpts||'<option disabled>Sin grupos</option>'}</select></div></div>
    <div style="display:flex;gap:10px;margin-top:4px;flex-wrap:wrap">
      <label style="display:flex;align-items:center;gap:5px;font-size:11px;cursor:pointer;font-family:var(--mo)"><input type="checkbox" id="ci-upd-stock" checked style="width:auto;accent-color:var(--ac)"> Actualizar stock</label>
      <label style="display:flex;align-items:center;gap:5px;font-size:11px;cursor:pointer;font-family:var(--mo)"><input type="checkbox" id="ci-upd-cost" checked style="width:auto;accent-color:var(--ac)"> Actualizar costo/u</label>
    </div>
    <div class="fr" style="margin-top:6px"><div class="fl" style="max-width:70px"><label>Cant. compra</label><input type="number" id="ci-qtyc" placeholder="4" min="0.001" step="0.001"></div><div class="fl" style="max-width:90px"><label>Unidad compra</label><input type="text" id="ci-uc" placeholder="cajón, bolsa..."></div><div class="fl" style="max-width:70px"><label>Cant. real</label><input type="number" id="ci-qtyr" placeholder="74" min="0.001" step="0.001"></div><div class="fl" style="max-width:80px"><label>Precio total $</label><input type="number" id="ci-precio" placeholder="0" oninput="calcCostoUnitario()"></div><button class="btn" onclick="addCompraItem()" style="align-self:flex-end;padding:6px 10px;font-size:11px">+</button></div>
    <div style="font-size:9px;color:var(--tx3);font-family:var(--mo);margin-top:3px" id="costo-preview"></div>
    <div style="font-size:9px;color:var(--tx3);font-family:var(--mo)">Cant. real = kg reales. Ej: 4 cajones → 74kg → costo/kg = total ÷ 74</div>
  </div>
  ${sgV().length?`<div class="blk"><div class="bt">Propagar costo/kg a grupos de stock</div>
    <div style="font-size:10px;color:var(--tx2);font-family:var(--mo);margin-bottom:8px">Marcá los grupos que deben actualizar su costo/kg con esta compra</div>
    <div>${propOpts}</div>
    <button class="btn" onclick="selAllProp()" style="font-size:11px;padding:4px 10px;margin-top:8px">Seleccionar todos</button>
  </div>`:''}
  <button class="btn btnp" onclick="saveCompra()" style="width:100%;margin-top:4px">✓ Guardar factura</button>
  <div class="sh">Compras de hoy</div>${cards}`;
}
function calcCpTotal(){const ef=parseFloat(document.getElementById('cp-ef')?.value)||0,tr=parseFloat(document.getElementById('cp-tr')?.value)||0;const tot=document.getElementById('cp-tot');if(tot)tot.value=ef+tr>0?$m(ef+tr):'';}
function onCiTipo(){
  const tipo=document.getElementById('ci-tipo')?.value;
  const refEl=document.getElementById('ci-ref');
  const row=document.getElementById('ci-item-row');
  if(!refEl)return;
  if(tipo==='sgv'){
    if(row)row.style.display='';
    refEl.innerHTML=sgV().map(g=>`<option value="sgv_${g.id}" data-u="${g.unit||'kg'}">${esc(g.name)} (${g.unit||'kg'})</option>`).join('')||'<option disabled>Sin grupos</option>';
  }else if(tipo==='ins'){
    if(row)row.style.display='';
    refEl.innerHTML=S.ins.map(i=>`<option value="ins_${i.id}" data-u="${i.unit}">${esc(i.name)} (${i.unit})</option>`).join('')||'<option disabled>Sin insumos</option>';
  }else{
    if(row)row.style.display='none';
  }
  calcCostoUnitario();
}
function calcCostoUnitario(){const precio=parseFloat(document.getElementById('ci-precio')?.value)||0,qtyR=parseFloat(document.getElementById('ci-qtyr')?.value)||0,qtyC=parseFloat(document.getElementById('ci-qtyc')?.value)||0,prev=document.getElementById('costo-preview');if(!prev)return;if(precio&&(qtyR||qtyC)){const base=qtyR||qtyC,costo=precio/base,refEl=document.getElementById('ci-ref'),unit=refEl?.options[refEl.selectedIndex]?.dataset?.u||'kg';prev.textContent=`→ Costo calculado: ${$d2(costo)}/${unit}`;prev.style.color='var(--ac)';}else{prev.textContent='';}}
function selAllProp(){sgV().forEach(g=>{const cb=document.getElementById('prop_'+g.id);if(cb)cb.checked=true;});}
function renderCompraItems(){
  const list=document.getElementById('cp-items-list');if(!list)return;
  if(!compraItems.length){list.innerHTML='';return;}
  const tot=compraItems.reduce((s,x)=>s+x.precio_total,0);
  list.innerHTML=compraItems.map((x,i)=>`<div class="compra-item"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div><div style="font-size:12px;font-weight:500">${esc(x.descripcion)}</div><div style="font-size:10px;color:var(--tx3);font-family:var(--mo)">${x.qty_compra} ${x.unit_compra||''} ${x.qty_real?'→ '+fQ(x.qty_real,x.unit_real):''}</div><div style="font-size:10px;color:var(--ac);font-family:var(--mo)">${$m(x.precio_total)} · costo: ${$d2(x.cost_unit_calculado||0)}/${x.unit_real||'kg'}</div><div style="font-size:9px;color:var(--tx3);font-family:var(--mo)">${x.upd_stock?'✓ stock':'○'} · ${x.upd_cost?'✓ costo':'○'}</div></div><button class="dbtn" onclick="rmCompraItem(${i})">✕</button></div></div>`).join('')
    +`<div style="text-align:right;font-size:12px;font-family:var(--mo);color:var(--ac);padding:5px 0">Total artículos: ${$m(tot)}</div>`;
}
function addCompraItem(){
  const desc=document.getElementById('ci-desc')?.value.trim();
  const tipoEl=document.getElementById('ci-tipo'),refEl=document.getElementById('ci-ref'),refOpt=refEl?.options[refEl.selectedIndex],refVal=refEl?.value;
  const tipo=tipoEl?.value||'sgv';
  const qtyC=parseFloat(document.getElementById('ci-qtyc')?.value)||0,uc=document.getElementById('ci-uc')?.value.trim()||'unidad',qtyR=parseFloat(document.getElementById('ci-qtyr')?.value)||0,precio=parseFloat(document.getElementById('ci-precio')?.value)||0;
  const updStock=document.getElementById('ci-upd-stock')?.checked!==false,updCost=document.getElementById('ci-upd-cost')?.checked!==false;
  if(!desc||!qtyC||!precio)return alert('Completá descripción, cantidad y precio');
  const unitReal=refOpt?.dataset?.u||'kg',base=qtyR||qtyC,costCalc=precio/base;
  const isStock=tipo==='sgv',isIns=tipo==='ins',ref_id=refVal?.replace(/^(sgv_|ins_)/,'')||'';
  compraItems.push({descripcion:desc,tipo_destino:isStock?'stock_venta':isIns?'insumo':'otro',ref_id,qty_compra:qtyC,unit_compra:uc,qty_real:qtyR||qtyC,unit_real:unitReal,precio_total:precio,cost_unit_calculado:costCalc,upd_stock:updStock,upd_cost:updCost});
  document.getElementById('ci-desc').value='';document.getElementById('ci-qtyc').value='';document.getElementById('ci-qtyr').value='';document.getElementById('ci-precio').value='';
  const prev=document.getElementById('costo-preview');if(prev)prev.textContent='';renderCompraItems();
}
function rmCompraItem(i){compraItems.splice(i,1);renderCompraItems();}
async function saveCompra(){
  const prov=document.getElementById('cp-prov')?.value.trim(),fact=document.getElementById('cp-fact')?.value.trim(),note=document.getElementById('cp-note')?.value.trim();
  const ef=parseFloat(document.getElementById('cp-ef')?.value)||0,tr=parseFloat(document.getElementById('cp-tr')?.value)||0;
  if(!prov)return alert('Ingresá el proveedor');if(!compraItems.length)return alert('Agregá al menos un artículo');
  const total=(ef+tr)||compraItems.reduce((s,x)=>s+x.precio_total,0);
  const propagarA=sgV().filter(g=>{const cb=document.getElementById('prop_'+g.id);return cb&&cb.checked;}).map(g=>g.id);
  const kgTotales=compraItems.reduce((s,x)=>s+(x.qty_real||x.qty_compra),0);
  const costoKgGlobal=kgTotales>0?total/kgTotales:(compraItems[0]?.cost_unit_calculado||0);
  const cId=uid(),gastoId=uid();
  const compra={id:cId,day,proveedor:prov,nro_factura:fact||null,total,pago_efectivo:ef,pago_transferencia:tr,grupos_propagados:JSON.stringify(propagarA),gasto_id:gastoId,note:note||null,time:arTime()};
  const items=compraItems.map(x=>({id:uid(),compra_id:cId,...x}));
  items.forEach(x=>{
    if(x.tipo_destino==='stock_venta'){const g=S.sg.find(sg=>sg.id===x.ref_id);if(g){if(x.upd_stock!==false)g.stock_qty=(g.stock_qty||0)+(x.qty_real||x.qty_compra);if(x.upd_cost!==false)g.cost_unit=x.cost_unit_calculado||g.cost_unit;}}
    else if(x.tipo_destino==='insumo'){const ins=S.ins.find(i=>i.id===x.ref_id);if(ins){if(x.upd_stock!==false)ins.stock_qty=(ins.stock_qty||0)+(x.qty_real||x.qty_compra);if(x.upd_cost!==false){ins.costUnit=x.cost_unit_calculado||ins.costUnit;ins.cost_unit=ins.costUnit;}}}
  });
  propagarA.forEach(gid=>{const g=S.sg.find(x=>x.id===gid);if(g)g.cost_unit=costoKgGlobal;});
  const gastoRow={id:gastoId,day,descripcion:'Compra: '+prov+(fact?' F/'+fact:''),cat:'Materia prima',amount:total,time:arTime()};
  if(!S.ga[day])S.ga[day]=[];S.ga[day].push(gastoRow);
  S.co.push(compra);S.coi.push(...items);compraItems=[];save();render();
  if(online){sync('busy','guardando...');try{await sbUp('compras',compra);if(items.length)await sbUp('compras_items',items);await sbUp('gastos',gastoRow);const ch=[...new Set([...items.map(x=>x.ref_id),...propagarA])];for(const id of ch){const g=S.sg.find(x=>x.id===id);if(g)await sbUp('stock_groups',{id:g.id,name:g.name,unit:g.unit,tipo:g.tipo,stock_qty:g.stock_qty,cost_unit:g.cost_unit||0});const ins=S.ins.find(x=>x.id===id);if(ins)await sbUp('insumos',{id:ins.id,name:ins.name,unit:ins.unit,cost_unit:ins.costUnit});}sync('ok','guardado');toast(`Costo/kg propagado a ${propagarA.length} grupo(s) ✓`);}catch(e){sync('err','error');console.error(e)}}
}
async function delCompra(id){
  if(!confirm('¿Eliminar factura? Se revertirá el stock y el gasto.'))return;
  const c=S.co.find(x=>x.id===id);if(!c)return;
  const items=S.coi.filter(x=>x.compra_id===id);
  items.forEach(x=>{
    if(x.tipo_destino==='stock_venta'){const g=S.sg.find(sg=>sg.id===x.ref_id);if(g)g.stock_qty=Math.max(0,(g.stock_qty||0)-(x.qty_real||x.qty_compra));}
    else if(x.tipo_destino==='insumo'){const ins=S.ins.find(i=>i.id===x.ref_id);if(ins)ins.stock_qty=Math.max(0,(ins.stock_qty||0)-(x.qty_real||x.qty_compra));}
  });
  if(c.gasto_id){Object.keys(S.ga).forEach(d=>{S.ga[d]=(S.ga[d]||[]).filter(g=>g.id!==c.gasto_id);});if(online){try{await sbDel('gastos',c.gasto_id);}catch(e){}}}
  S.co=S.co.filter(x=>x.id!==id);S.coi=S.coi.filter(x=>x.compra_id!==id);save();render();
  if(online){try{await sbDel('compras',id);const ch=[...new Set(items.filter(x=>x.tipo_destino==='stock_venta').map(x=>x.ref_id))];for(const gid of ch){const g=S.sg.find(x=>x.id===gid);if(g)await sbUp('stock_groups',{id:g.id,name:g.name,unit:g.unit,tipo:g.tipo,stock_qty:g.stock_qty,cost_unit:g.cost_unit||0});}}catch(e){}}
}

/* ══ REPORTES ══════════════════════════════════════════════════════ */
function getMths(){const s=new Set();Object.keys(S.ve).forEach(d=>s.add(d.slice(0,7)));Object.keys(S.ga).forEach(d=>s.add(d.slice(0,7)));return[...s].sort((a,b)=>b.localeCompare(a))}
function mData(ym){
  const vs=Object.entries(S.ve).filter(([d])=>d.startsWith(ym)).flatMap(([,v])=>v);
  const tv=vs.reduce((s,v)=>s+v.total,0);
  const tvEf=vs.filter(v=>v.pago==='Efectivo'||(v.pago_ef>0&&v.pago==='mixto')).reduce((s,v)=>s+(v.pago==='Efectivo'?v.total:(v.pago_ef||0)),0);
  const tvTr=tv-tvEf;
  const byG={};vs.forEach(v=>{const g=S.sg.find(x=>x.id===v.group_id),gn=g?g.name:'Otros';if(!byG[gn])byG[gn]={qty:0,tot:0,ef:0,tr:0,unit:g?.unit||''};byG[gn].qty+=(v.stock_used||0);byG[gn].tot+=v.total;if(v.pago==='Efectivo')byG[gn].ef+=v.total;else byG[gn].tr+=v.total;});
  const _compraIdsM=new Set(S.co.map(c=>c.gasto_id).filter(Boolean));
  const tg=Object.entries(S.ga).filter(([d])=>d.startsWith(ym)).flatMap(([,g])=>g).filter(g=>!_compraIdsM.has(g.id)).reduce((s,g)=>s+g.amount,0);
  const tCompras=S.co.filter(c=>c.day.startsWith(ym)).reduce((s,c)=>s+c.total,0);
  const movs=Object.entries(S.caja).filter(([d])=>d.startsWith(ym)).flatMap(([,m])=>m);
  const ingEf=movs.filter(m=>m.tipo==='ingreso'&&m.metodo==='efectivo').reduce((s,m)=>s+m.monto,0);
  const ingTr=movs.filter(m=>m.tipo==='ingreso'&&m.metodo==='transferencia').reduce((s,m)=>s+m.monto,0);
  const egEf=movs.filter(m=>m.tipo==='egreso'&&m.metodo==='efectivo').reduce((s,m)=>s+m.monto,0);
  const egTr=movs.filter(m=>m.tipo==='egreso'&&m.metodo==='transferencia').reduce((s,m)=>s+m.monto,0);
  const ingTotal=ingEf+ingTr,egTotal=egEf+egTr,resultado=tv+ingTotal-egTotal-tg-tCompras;
  return{vs,tv,tvEf,tvTr,tg,tCompras,byG,ingEf,ingTr,egEf,egTr,ingTotal,egTotal,resultado};
}
function dayData(d){
  const vs=S.ve[d]||[],tv=vs.reduce((s,v)=>s+v.total,0);
  const tvEf=vs.filter(v=>v.pago==='Efectivo').reduce((s,v)=>s+v.total,0);
  const byG={};vs.forEach(v=>{const g=S.sg.find(x=>x.id===v.group_id),gn=g?g.name:'Otros';if(!byG[gn])byG[gn]={qty:0,tot:0,ef:0,tr:0,unit:g?.unit||''};byG[gn].qty+=(v.stock_used||0);byG[gn].tot+=v.total;if(v.pago==='Efectivo')byG[gn].ef+=v.total;else byG[gn].tr+=v.total;});
  const _compraIdsD=new Set(S.co.map(c=>c.gasto_id).filter(Boolean));
  const tg=(S.ga[d]||[]).filter(g=>!_compraIdsD.has(g.id)).reduce((s,g)=>s+g.amount,0);
  const tCompras=S.co.filter(c=>c.day===d).reduce((s,c)=>s+c.total,0);
  const movs=S.caja[d]||[];const ingTotal=movs.filter(m=>m.tipo==='ingreso').reduce((s,m)=>s+m.monto,0),egTotal=movs.filter(m=>m.tipo==='egreso').reduce((s,m)=>s+m.monto,0);
  const ingEf=movs.filter(m=>m.tipo==='ingreso'&&m.metodo==='efectivo').reduce((s,m)=>s+m.monto,0),ingTr=movs.filter(m=>m.tipo==='ingreso'&&m.metodo==='transferencia').reduce((s,m)=>s+m.monto,0);
  return{vs,tv,tvEf,tvTr:tv-tvEf,byG,tg,tCompras,ingTotal,egTotal,ingEf,ingTr,resultado:tv+ingTotal-egTotal-tg-tCompras};
}
function yrData(yr){const ms=[];for(let m=1;m<=12;m++){const ym=yr+'-'+m.toString().padStart(2,'0');const{tv,tg,tCompras,ingTotal,egTotal}=mData(ym);ms.push({lbl:fM(ym).split(' ')[0],tv,tg:tg+tCompras,res:tv+ingTotal-egTotal-tg-tCompras})}return ms}

function rReportes(){
  const mths=getMths();if(!mths.includes(rMonth)&&mths.length)rMonth=mths[0];
  const yr=rMonth.split('-')[0];
  const mthTabs=mths.length?mths.map(m=>`<button class="mtab ${m===rMonth?'active':''}" onclick="setRM('${m}')">${fM(m)}</button>`).join(''):`<span style="font-size:10px;color:var(--tx3);font-family:var(--mo)">Sin datos aún</span>`;
  const rTabs=`<div class="mtabs" style="margin-bottom:8px">
    <button class="mtab ${rTab==='dia'?'active':''}" onclick="setRTab('dia')">📅 Día</button>
    <button class="mtab ${rTab==='mes'?'active':''}" onclick="setRTab('mes')">📆 Mes</button>
    <button class="mtab ${rTab==='anual'?'active':''}" onclick="setRTab('anual')">📈 Anual</button>
    <button class="mtab ${rTab==='financiero'?'active':''}" onclick="setRTab('financiero')">💹 Financiero</button>
  </div>`;
  if(rTab==='dia')return rTabs+rRepDia();
  if(rTab==='mes')return rTabs+rRepMes(mthTabs);
  if(rTab==='anual')return rTabs+rRepAnual(yr);
  if(rTab==='financiero')return rTabs+rRepFin(mthTabs);
  return'';
}
function setRM(m){rMonth=m;go('reportes')}
function setRTab(t){rTab=t;go('reportes')}
function toggleDetail(id){const el=document.getElementById(id);if(el)el.style.display=el.style.display==='none'?'block':'none';}

function rRepDia(){
  const{vs,tv,tvEf,tvTr,byG,tg,tCompras,ingTotal,egTotal,ingEf,ingTr,resultado}=dayData(day);
  const bgRows=Object.entries(byG).sort((a,b)=>b[1].tot-a[1].tot).map(([n,d])=>`<tr><td>${esc(n)}</td><td style="font-family:var(--mo)">${fQ(d.qty,d.unit)}</td><td style="font-family:var(--mo)">${$m(d.tot)}</td><td style="font-family:var(--mo);color:var(--gn)">${$m(d.ef)}</td><td style="font-family:var(--mo);color:var(--bl)">${$m(d.tr)}</td></tr>`).join('')||`<tr><td colspan="5" class="empty-row">Sin ventas</td></tr>`;
  // tickets del dia agrupados
  const byTicket={};vs.forEach(v=>{const tk=v.ticket_id||v.id;if(!byTicket[tk])byTicket[tk]={items:[],total:0,pago:v.pago,time:v.time||''};byTicket[tk].items.push(v);byTicket[tk].total+=v.total;});
  const tktRows=Object.entries(byTicket).sort((a,b)=>a[1].time.localeCompare(b[1].time)).map(([tid,tk])=>`<tr><td>${tk.time}</td><td>${tk.items.length} ítem(s)</td><td style="font-family:var(--mo)">${$m(tk.total)}</td><td><span class="tag tv">${(tk.pago||'').slice(0,3)}</span></td></tr>`).join('')||`<tr><td colspan="4" class="empty-row">Sin tickets</td></tr>`;
  const _compraIds=new Set(S.co.map(c=>c.gasto_id).filter(Boolean));
  const gsRows=(S.ga[day]||[]).filter(g=>!_compraIds.has(g.id)).map(g=>`<tr><td>${g.time||''}</td><td>${esc(g.descripcion)}</td><td><span class="tag tg">${(g.cat||'').slice(0,5)}</span></td><td>${$m(g.amount)}</td></tr>`).join('')||`<tr><td colspan="4" class="empty-row">Sin gastos operativos</td></tr>`;
  const compHoy=S.co.filter(c=>c.day===day).map(c=>`<tr><td>${c.time||''}</td><td>${esc(c.proveedor)}</td><td><span class="tag to">compra</span></td><td>${$m(c.total)}</td></tr>`).join('');
  return`
  <div style="font-size:11px;color:var(--tx2);font-family:var(--mo);margin-bottom:10px">📅 ${fDL(day)}</div>
  <div class="kpis t3">
    <div class="kc hi" onclick="toggleDetail('det-vd')" style="cursor:pointer"><div class="kl">Ventas ▾</div><div class="kv a">${$m(tv)}</div><div class="kh">${Object.keys(byTicket).length} tickets</div></div>
    <div class="kc" onclick="toggleDetail('det-gd')" style="cursor:pointer"><div class="kl">Gastos ▾</div><div class="kv r">${$m(tg+tCompras)}</div><div class="kh" style="color:var(--tx3)">op. ${$m(tg)} · comp. ${$m(tCompras)}</div></div>
    <div class="kc"><div class="kl">Resultado</div><div class="kv ${resultado>=0?'g':'r'}">${$m(resultado)}</div></div>
  </div>
  <div id="det-vd" style="display:none">
    <div class="tbk"><div class="tt">Tickets del día</div><table><thead><tr><th>Hora</th><th>Ítems</th><th>Total</th><th>Pago</th></tr></thead><tbody>${tktRows}</tbody></table></div>
    <div class="tbk"><div class="tt">Por grupo</div><table><thead><tr><th>Grupo</th><th>Cantidad</th><th>Total</th><th>Efectivo</th><th>Transf.</th></tr></thead><tbody>${bgRows}</tbody></table></div>
  </div>
  <div id="det-gd" style="display:none">
    ${tg>0?`<div class="tbk"><div class="tt">Gastos operativos</div><table><thead><tr><th>Hora</th><th>Descripción</th><th>Cat.</th><th>Monto</th></tr></thead><tbody>${gsRows}</tbody></table></div>`:''}
    ${compHoy?`<div class="tbk"><div class="tt">Compras del día</div><table><thead><tr><th>Hora</th><th>Proveedor</th><th>Tipo</th><th>Total</th></tr></thead><tbody>${compHoy}</tbody></table></div>`:''}
    ${!tg&&!compHoy?`<div style="font-size:11px;color:var(--tx3);font-family:var(--mo);padding:8px 0">Sin gastos ni compras</div>`:''}
  </div>
  <div class="kpis">
    <div class="kc"><div class="kl">Efectivo</div><div class="kv g">${$m(tvEf+ingEf)}</div></div>
    <div class="kc"><div class="kl">Digital</div><div class="kv b">${$m(tvTr+ingTr)}</div></div>
  </div>
  <button class="btn btng" onclick="exportExcel()" style="width:100%;margin-top:6px">⬇ Exportar todo a Excel</button>`;
}

function rRepMes(mthTabs){
  const{tv,tvEf,tvTr,tg,tCompras,byG,ingEf,ingTr,egEf,egTr,ingTotal,egTotal,resultado}=mData(rMonth);
  const bgRows=Object.entries(byG).sort((a,b)=>b[1].tot-a[1].tot).map(([n,d])=>`<tr><td>${esc(n)}</td><td style="font-family:var(--mo)">${fQ(d.qty,d.unit)}</td><td style="font-family:var(--mo)">${$m(d.tot)}</td><td style="font-family:var(--mo);color:var(--gn)">${$m(d.ef)}</td><td style="font-family:var(--mo);color:var(--bl)">${$m(d.tr)}</td></tr>`).join('')||`<tr><td colspan="5" class="empty-row">Sin datos</td></tr>`;
  const gastosMes=Object.entries(S.ga).filter(([d])=>d.startsWith(rMonth)).flatMap(([d,gs])=>gs.map(g=>({...g,_d:d})));
  const _compraIdsMes=new Set(S.co.map(c=>c.gasto_id).filter(Boolean));
  const gsRows=gastosMes.filter(g=>!_compraIdsMes.has(g.id)).sort((a,b)=>a._d.localeCompare(b._d)).map(g=>`<tr><td>${fD(g._d)}</td><td>${esc(g.descripcion)}</td><td><span class="tag tg">${(g.cat||'').slice(0,5)}</span></td><td>${$m(g.amount)}</td></tr>`).join('')||`<tr><td colspan="4" class="empty-row">Sin gastos operativos</td></tr>`;
  const comprasMes=S.co.filter(c=>c.day.startsWith(rMonth)).map(c=>`<tr><td>${fD(c.day)}</td><td>${esc(c.proveedor)}</td><td><span class="tag to">compra</span></td><td>${$m(c.total)}</td></tr>`).join('');
  return`
  <div class="mtabs">${mthTabs}</div>
  <div class="kpis t3">
    <div class="kc hi" onclick="toggleDetail('det-vm')" style="cursor:pointer"><div class="kl">Ventas ▾</div><div class="kv a">${$m(tv)}</div><div class="kh">click para ver</div></div>
    <div class="kc" onclick="toggleDetail('det-gm')" style="cursor:pointer"><div class="kl">Gastos ▾</div><div class="kv r">${$m(tg+tCompras)}</div><div class="kh" style="color:var(--tx3)">op. ${$m(tg)} · comp. ${$m(tCompras)}</div></div>
    <div class="kc"><div class="kl">Resultado</div><div class="kv ${resultado>=0?'g':'r'}">${$m(resultado)}</div></div>
  </div>
  <div id="det-vm" style="display:none">
    <div class="tbk"><div class="tt">Ventas por grupo — ${fM(rMonth)}</div><table><thead><tr><th>Grupo</th><th>Cantidad</th><th>Total</th><th>Efectivo</th><th>Transf.</th></tr></thead><tbody>${bgRows}</tbody></table></div>
  </div>
  <div id="det-gm" style="display:none">
    ${tg>0?`<div class="tbk"><div class="tt">Gastos operativos — ${fM(rMonth)}</div><table><thead><tr><th>Fecha</th><th>Descripción</th><th>Cat.</th><th>Monto</th></tr></thead><tbody>${gsRows}</tbody></table></div>`:''}
    ${comprasMes?`<div class="tbk"><div class="tt">Compras del mes — ${fM(rMonth)}</div><table><thead><tr><th>Fecha</th><th>Proveedor</th><th>Tipo</th><th>Total</th></tr></thead><tbody>${comprasMes}</tbody></table></div>`:''}
    ${!tg&&!comprasMes?`<div style="font-size:11px;color:var(--tx3);font-family:var(--mo);padding:8px 0">Sin gastos ni compras</div>`:''}
  </div>
  <div class="kpis t3">
    <div class="kc"><div class="kl">Ef. ventas</div><div class="kv g" style="font-size:14px">${$m(tvEf)}</div></div>
    <div class="kc"><div class="kl">Tr. ventas</div><div class="kv b" style="font-size:14px">${$m(tvTr)}</div></div>
    <div class="kc"><div class="kl">Mov. extra</div><div class="kv ${ingTotal-egTotal>=0?'g':'r'}" style="font-size:14px">${$m(ingTotal-egTotal)}</div></div>
  </div>
  <div class="blk"><div class="bt">Ventas diarias — ${fM(rMonth)}</div><div class="ch-w"><canvas id="cM"></canvas></div></div>
  <button class="btn btng" onclick="exportExcel()" style="width:100%;margin-top:6px">⬇ Exportar todo a Excel</button>`;
}

function rRepAnual(yr){
  const an=yrData(yr);const totV=an.reduce((s,x)=>s+x.tv,0),totG=an.reduce((s,x)=>s+x.tg,0),totRes=an.reduce((s,x)=>s+x.res,0);
  const rows=an.map(m=>`<tr><td>${m.lbl}</td><td style="font-family:var(--mo);color:var(--ac)">${$m(m.tv)}</td><td style="font-family:var(--mo);color:var(--rd)">${$m(m.tg)}</td><td style="font-family:var(--mo);font-weight:500;color:${m.res>=0?'var(--gn)':'var(--rd)'}">${$m(m.res)}</td></tr>`).join('');
  return`
  <div class="kpis t3"><div class="kc hi"><div class="kl">Ventas ${yr}</div><div class="kv a">${$m(totV)}</div></div><div class="kc"><div class="kl">Gastos ${yr}</div><div class="kv r">${$m(totG)}</div></div><div class="kc"><div class="kl">Resultado</div><div class="kv ${totRes>=0?'g':'r'}">${$m(totRes)}</div></div></div>
  <div class="blk"><div class="bt">Ventas vs Gastos — ${yr}</div><div class="ch-w" style="height:155px"><canvas id="cA"></canvas></div></div>
  <div class="tbk"><div class="tt">Detalle mensual ${yr}</div><table><thead><tr><th>Mes</th><th>Ventas</th><th>Gastos</th><th>Resultado</th></tr></thead><tbody>${rows}</tbody></table></div>
  <button class="btn btng" onclick="exportExcel()" style="width:100%;margin-top:6px">⬇ Exportar todo a Excel</button>`;
}

function rRepFin(mthTabs){
  const{tv,tvEf,tvTr,tg,tCompras,byG,ingEf,ingTr,egEf,egTr,ingTotal,egTotal,resultado}=mData(rMonth);
  const tGastoTotal=tg+tCompras;
  const ingresoTotal=tv+ingTotal;const margen=ingresoTotal>0?Math.round((resultado/ingresoTotal)*100):0;
  const margenCol=margen>30?'var(--gn)':margen>10?'var(--ac)':'var(--rd)';
  const _compraIdsFin=new Set(S.co.map(c=>c.gasto_id).filter(Boolean));
  const catGas={};
  // gastos operativos por categoria
  Object.entries(S.ga).filter(([d])=>d.startsWith(rMonth)).flatMap(([,g])=>g).filter(g=>!_compraIdsFin.has(g.id)).forEach(g=>{catGas[g.cat]=(catGas[g.cat]||0)+g.amount});
  // compras como categoria propia
  if(tCompras>0)catGas['Materia prima (compras)']=(catGas['Materia prima (compras)']||0)+tCompras;
  const catRows=Object.entries(catGas).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<tr><td>${c}</td><td style="font-family:var(--mo)">${$m(v)}</td><td style="font-family:var(--mo);color:var(--tx3)">${Math.round(tGastoTotal>0?(v/tGastoTotal)*100:0)}%</td></tr>`).join('')||`<tr><td colspan="3" class="empty-row">Sin gastos</td></tr>`;
  return`
  <div class="mtabs">${mthTabs}</div>
  <div class="kpis t3"><div class="kc hi"><div class="kl">Ingresos totales</div><div class="kv a">${$m(ingresoTotal)}</div><div class="kh">ventas + extra</div></div><div class="kc"><div class="kl">Gastos totales</div><div class="kv r">${$m(tGastoTotal)}</div><div class="kh" style="font-size:9px;color:var(--tx3)">op. ${$m(tg)} · comp. ${$m(tCompras)}</div></div><div class="kc"><div class="kl">Resultado</div><div class="kv ${resultado>=0?'g':'r'}">${$m(resultado)}</div></div></div>
  <div class="kpis t3"><div class="kc"><div class="kl">Margen</div><div class="kv" style="color:${margenCol}">${margen}%</div></div><div class="kc"><div class="kl">Efectivo total</div><div class="kv g" style="font-size:14px">${$m(tvEf+ingEf-egEf)}</div></div><div class="kc"><div class="kl">Digital total</div><div class="kv b" style="font-size:14px">${$m(tvTr+ingTr-egTr)}</div></div></div>
  ${ingTotal>0||egTotal>0?`<div class="blk"><div class="bt">Movimientos de caja del período</div><div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--br)"><span style="font-size:11px;color:var(--tx2)">Ingresos extra</span><span style="font-family:var(--mo);color:var(--gn)">${$m(ingTotal)}</span></div><div style="display:flex;justify-content:space-between;padding:5px 0"><span style="font-size:11px;color:var(--tx2)">Egresos extra</span><span style="font-family:var(--mo);color:var(--rd)">${$m(egTotal)}</span></div></div>`:''}
  <div class="tbk"><div class="tt">Gastos operativos por categoría</div><table><thead><tr><th>Categoría</th><th>Monto</th><th>%</th></tr></thead><tbody>${catRows}</tbody></table></div>
  <button class="btn btng" onclick="exportExcel()" style="width:100%;margin-top:6px">⬇ Exportar todo a Excel</button>`;
}

function initCharts(){
  const ym=rMonth,yr=ym.split('-')[0];const[y2,mo]=ym.split('-').map(Number);const dc=new Date(y2,mo,0).getDate();
  const labs=[],dV=[],dG=[];for(let d=1;d<=dc;d++){const ds=ym+'-'+d.toString().padStart(2,'0');labs.push(d);dV.push((S.ve[ds]||[]).reduce((s,x)=>s+x.total,0));dG.push((S.ga[ds]||[]).reduce((s,x)=>s+x.amount,0));}
  const OPTS={responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#8a8680',font:{size:9,family:'DM Mono'}}}},scales:{x:{ticks:{color:'#4e4b48',font:{size:8}},grid:{color:'#252525'}},y:{ticks:{color:'#4e4b48',font:{size:9},callback:v=>'$'+Math.round(v).toLocaleString('es-AR')},grid:{color:'#252525'}}}};
  const cm=document.getElementById('cM');if(cm&&window.Chart){try{if(charts.cM)charts.cM.destroy()}catch(e){}charts.cM=new Chart(cm,{type:'bar',data:{labels:labs,datasets:[{label:'Ventas',data:dV,backgroundColor:'rgba(232,197,71,.7)',borderRadius:3},{label:'Gastos',data:dG,backgroundColor:'rgba(248,113,113,.45)',borderRadius:3}]},options:OPTS});}
  const ca=document.getElementById('cA');if(ca&&window.Chart){try{if(charts.cA)charts.cA.destroy()}catch(e){}const an=yrData(yr);charts.cA=new Chart(ca,{type:'line',data:{labels:an.map(x=>x.lbl),datasets:[{label:'Ventas',data:an.map(x=>x.tv),borderColor:'rgba(232,197,71,.9)',backgroundColor:'rgba(232,197,71,.07)',tension:.3,fill:true,pointRadius:3,borderWidth:2},{label:'Gastos',data:an.map(x=>x.tg),borderColor:'rgba(248,113,113,.7)',backgroundColor:'transparent',tension:.3,pointRadius:3,borderWidth:1.5,borderDash:[4,3]}]},options:OPTS});}
}

/* ══ EXCEL ══════════════════════════════════════════════════════ */
function exportExcel(){
  if(!window.XLSX){alert('Librería cargando, intentá en unos segundos');return;}
  const wb=XLSX.utils.book_new();
  const va=[['Fecha','Hora','Ticket','Grupo','Variante','Cant.','Stock usado','Unidad','Precio unit.','Desc %','Total','Pago']];
  Object.entries(S.ve).sort(([a],[b])=>a.localeCompare(b)).forEach(([d,vs])=>vs.forEach(v=>{const vr=S.vr.find(x=>x.id===v.variant_id),gr=S.sg.find(x=>x.id===v.group_id);va.push([fDL(d),v.time||'',v.ticket_id||v.id,gr?.name||'',vr?.name||'',v.qty,v.stock_used||0,gr?.unit||'',v.price_unit,v.descuento_pct||0,v.total,v.pago]);}));
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(va),'Ventas');
  const ga=[['Fecha','Hora','Descripción','Categoría','Monto']];Object.entries(S.ga).sort(([a],[b])=>a.localeCompare(b)).forEach(([d,gs])=>gs.forEach(g=>ga.push([fDL(d),g.time||'',g.descripcion,g.cat,g.amount])));
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(ga),'Gastos');
  const ca2=[['Fecha','Hora','Proveedor','Nro Factura','Total','Efectivo','Transferencia','Nota']];S.co.forEach(c=>ca2.push([fDL(c.day),c.time||'',c.proveedor,c.nro_factura||'',c.total,c.pago_efectivo||0,c.pago_transferencia||0,c.note||'']));
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(ca2),'Compras');
  const cta=[['Fecha','Hora','Corte','Grupo','Cantidad','Unidad']];S.ct.forEach(c=>{S.cti.filter(i=>i.corte_id===c.id).forEach(i=>cta.push([fDL(c.day),c.time||'',c.nombre,i.nombre,i.qty,i.unit||'']));});
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(cta),'Cortes');
  const ela=[['Fecha','Hora','Elaboración','Ingrediente','Tipo','Cantidad','Unidad','Costo ref.']];S.el.forEach(e=>{S.eli.filter(i=>i.elaboracion_id===e.id).forEach(i=>ela.push([fDL(e.day),e.time||'',e.nombre,i.nombre,i.tipo,i.qty,i.unit||'',i.costo_subtotal||0]));});
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(ela),'Elaboraciones');
  const cja=[['Fecha','Hora','Tipo','Descripción','Método','Monto']];Object.entries(S.caja).sort(([a],[b])=>a.localeCompare(b)).forEach(([d,ms])=>ms.forEach(m=>cja.push([fDL(d),m.time||'',m.tipo,m.descripcion,m.metodo,m.monto])));
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(cja),'Caja');
  const rm=[['Mes','Ventas','Efectivo','Transferencias','Gastos','Resultado']];getMths().forEach(ym=>{const{tv,tvEf,tvTr,tg,resultado}=mData(ym);rm.push([fM(ym),tv,tvEf,tvTr,tg,resultado]);});
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rm),'Resumen mensual');
  const sta=[['Nombre','Tipo','Unidad','Stock actual','Costo/u']];S.sg.forEach(g=>sta.push([g.name,g.tipo||'venta',g.unit||'kg',g.stock_qty||0,g.cost_unit||0]));
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(sta),'Stock');
  XLSX.writeFile(wb,`LosPollosCunados_${arDay().replace(/-/g,'')}.xlsx`);toast('Excel descargado ✓');
}

/* ══ BOOT ══════════════════════════════════════════════════════ */
if(sesion){document.getElementById('login-screen').style.display='none';document.getElementById('app-screen').style.display='block';initApp();}
else{fetch(SB+'/rest/v1/usuarios',{headers:SBH}).then(r=>r.json()).then(us=>{if(us?.length)S.us=us;}).catch(()=>{});}

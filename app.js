/* ═══════════════════════════════════════════════════════
   LOS POLLOS CUÑADOS v4 — app.js
═══════════════════════════════════════════════════════ */

const SB='https://pfxvkvvzxpwobtynupgk.supabase.co';
const SK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmeHZrdnZ6eHB3b2J0eW51cGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjM3NjIsImV4cCI6MjA5MDczOTc2Mn0.H2tqmv0T9npDmNW3Pid2qnUSze7EHvO1ky0-NQzmFIY';
const SBH={'apikey':SK,'Authorization':'Bearer '+SK,'Content-Type':'application/json','Prefer':'return=minimal'};

async function sbQ(t,q=''){const r=await fetch(SB+'/rest/v1/'+t+'?'+q,{headers:SBH});if(!r.ok)throw new Error(await r.text());return r.json();}
async function sbUp(t,d){const r=await fetch(SB+'/rest/v1/'+t,{method:'POST',headers:{...SBH,'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(Array.isArray(d)?d:[d])});if(!r.ok)throw new Error(await r.text());}
async function sbDel(t,id){const r=await fetch(SB+'/rest/v1/'+t+'?id=eq.'+encodeURIComponent(id),{method:'DELETE',headers:SBH});if(!r.ok)throw new Error(await r.text());}

/* ── LOCAL CACHE ── */
const LC={g(k){try{return JSON.parse(localStorage.getItem('lpc4_'+k))||null}catch{return null}},s(k,v){localStorage.setItem('lpc4_'+k,JSON.stringify(v))}};

/* ── STATE ── */
let S={
  usuarios: LC.g('us')||[],
  sg:  LC.g('sg')||[],
  vr:  LC.g('vr')||[],
  ve:  LC.g('ve')||{},
  caja:LC.g('caja')||{},
  co:  LC.g('co')||[],
  coi: LC.g('coi')||[],
  pr:  LC.g('pr')||[],
  pri: LC.g('pri')||[],
  ga:  LC.g('ga')||{},
  ins: LC.g('ins')||[],
};

let tab='caja', day=arDay(), online=navigator.onLine;
let sesion=LC.g('sesion')||null;
let lotItems=[], compraItems=[];
let charts={};
let rMonth=arMonth(), rTab='mes';
let pinBuf='', loginRol='dueno';

/* ── TIMEZONE: Argentina (UTC-3) ── */
function arNow(){return new Date(new Date().toLocaleString('en-US',{timeZone:'America/Argentina/Buenos_Aires'}))}
function arDay(){const d=arNow();return d.getFullYear()+'-'+(d.getMonth()+1).toString().padStart(2,'0')+'-'+d.getDate().toString().padStart(2,'0')}
function arMonth(){const d=arNow();return d.getFullYear()+'-'+(d.getMonth()+1).toString().padStart(2,'0')}
function arTime(){return arNow().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}
function fD(s){if(!s)return'';const[,m,d]=s.split('-');return d+'/'+m}
function fDL(s){if(!s)return'';const[y,m,d]=s.split('-');return d+'/'+m+'/'+y}
function fM(s){if(!s)return'';const[y,m]=s.split('-');return['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][+m-1]+' '+y}
function $m(n){return'$'+Math.round(n||0).toLocaleString('es-AR')}
function $d2(n){return'$'+(+(n||0)).toFixed(2)}
function fmtQty(n,unit){return(+(n||0)).toFixed(2).replace(/\.00$/,'')+' '+(unit||'')}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,5)}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function dV(){return S.ve[day]||[]}
function dG(){return S.ga[day]||[]}
function dCaja(){return S.caja[day]||[]}
function sgVenta(){return S.sg.filter(g=>g.tipo==='venta'||!g.tipo)}
function sgProd(){return S.sg.filter(g=>g.tipo==='produccion')}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),2400)}
function sync(s,l){const d=document.getElementById('sdot'),lb=document.getElementById('slbl');if(d){d.className='sdot '+s;lb.textContent=l}}
function save(){LC.s('us',S.usuarios);LC.s('sg',S.sg);LC.s('vr',S.vr);LC.s('ve',S.ve);LC.s('caja',S.caja);LC.s('co',S.co);LC.s('coi',S.coi);LC.s('pr',S.pr);LC.s('pri',S.pri);LC.s('ga',S.ga);LC.s('ins',S.ins);}

window.addEventListener('online',()=>{online=true;loadAll()});
window.addEventListener('offline',()=>{online=false;sync('err','offline')});

/* ══════════════════════════════════════════
   LOGIN / SESIÓN
══════════════════════════════════════════ */
function selUser(rol){
  loginRol=rol;pinBuf='';
  document.getElementById('usel-dueno').classList.toggle('active',rol==='dueno');
  document.getElementById('usel-empleado').classList.toggle('active',rol==='empleado');
  updatePinDisplay();
}
function pinPress(d){if(pinBuf.length>=6)return;pinBuf+=d;updatePinDisplay();}
function pinClear(){pinBuf='';updatePinDisplay();document.getElementById('pin-error').textContent='';}
function updatePinDisplay(){const el=document.getElementById('pin-display');if(el)el.textContent=pinBuf?'●'.repeat(pinBuf.length):'····';}
async function pinOk(){
  if(!pinBuf){document.getElementById('pin-error').textContent='Ingresá tu PIN';return;}
  // check against loaded usuarios or defaults
  let usr=S.usuarios.find(u=>u.rol===loginRol&&u.pin===pinBuf&&u.activo!==false);
  if(!usr){
    // fallback defaults if no users loaded yet
    if(loginRol==='dueno'&&pinBuf==='1234')usr={id:'usr_dueno',nombre:'Dueño',rol:'dueno'};
    else if(loginRol==='empleado'&&pinBuf==='0000')usr={id:'usr_empleado',nombre:'Empleado',rol:'empleado'};
  }
  if(!usr){document.getElementById('pin-error').textContent='PIN incorrecto';pinBuf='';updatePinDisplay();return;}
  sesion={id:usr.id,nombre:usr.nombre,rol:usr.rol};
  LC.s('sesion',sesion);
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app-screen').style.display='block';
  initApp();
}
function doLogout(){sesion=null;LC.s('sesion',null);pinBuf='';updatePinDisplay();document.getElementById('login-screen').style.display='flex';document.getElementById('app-screen').style.display='none';}

/* ── NAV SEGÚN ROL ── */
const NAV_DUENO=[
  {id:'caja',icon:'💰',label:'Caja'},
  {id:'stock',icon:'📦',label:'Stock'},
  {id:'prod',icon:'🔪',label:'Prod.'},
  {id:'compras',icon:'🛒',label:'Compras'},
  {id:'reportes',icon:'📊',label:'Reportes'},
];
const NAV_EMPLEADO=[
  {id:'caja',icon:'💰',label:'Caja'},
  {id:'gastos',icon:'🧾',label:'Gastos'},
];

function buildNav(){
  const items=sesion?.rol==='dueno'?NAV_DUENO:NAV_EMPLEADO;
  document.getElementById('bottom-nav').innerHTML=items.map(n=>`<div class="bni ${n.id===tab?'active':''}" id="bn-${n.id}" onclick="go('${n.id}')"><div class="bi">${n.icon}</div><div class="bl">${n.label}</div></div>`).join('');
}

function go(t){
  tab=t;
  document.querySelectorAll('.bni').forEach(el=>el.classList.toggle('active',el.id==='bn-'+t));
  render();
}
function chDay(d){
  const dt=new Date(day+'T12:00:00');dt.setDate(dt.getDate()+d);
  const nd=dt.toISOString().split('T')[0];
  if(nd>arDay())return;
  day=nd;render();
}

/* ══════════════════════════════════════════
   INIT & LOAD
══════════════════════════════════════════ */
function initApp(){
  day=arDay();
  buildNav();
  sync('busy','cargando...');
  loadAll().then(()=>{if(!online)sync('err','offline')});
  render();
}

async function loadAll(){
  if(!online){sync('err','offline');return}
  sync('busy','cargando...');
  try{
    const[us,sg,vr,ve,caja,co,coi,pr,pri,ga,ins]=await Promise.all([
      sbQ('usuarios'),
      sbQ('stock_groups','order=name'),
      sbQ('stock_variants','order=name'),
      sbQ('ventas','order=created_at'),
      sbQ('caja_movimientos','order=created_at'),
      sbQ('compras','order=created_at'),
      sbQ('compras_items','order=created_at'),
      sbQ('produccion','order=created_at'),
      sbQ('produccion_items','order=created_at'),
      sbQ('gastos','order=created_at'),
      sbQ('insumos','order=name'),
    ]);
    S.usuarios=us;
    S.sg=sg.map(g=>({...g,stock_qty:g.stock_qty||0,cost_unit:g.cost_unit||0}));
    S.vr=vr;
    S.ins=ins.map(i=>({...i,costUnit:i.cost_unit||0}));
    S.co=co;S.coi=coi;
    S.pr=pr.map(p=>({...p,date:p.day}));
    S.pri=pri;
    const vm={},gm={},cm={};
    ve.forEach(x=>{if(!vm[x.day])vm[x.day]=[];vm[x.day].push(x)});
    ga.forEach(x=>{if(!gm[x.day])gm[x.day]=[];gm[x.day].push(x)});
    caja.forEach(x=>{if(!cm[x.day])cm[x.day]=[];cm[x.day].push(x)});
    S.ve=vm;S.ga=gm;S.caja=cm;
    save();sync('ok','sincronizado');render();
  }catch(e){sync('err','error');console.error(e)}
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
  else if(tab==='prod'){c.innerHTML=rProd();renderLotItems();}
  else if(tab==='compras')c.innerHTML=rCompras();
  else if(tab==='gastos')c.innerHTML=rGastos();
  else if(tab==='reportes'){c.innerHTML=rReportes();initCharts();}
}

/* ══════════════════════════════════════════
   CAJA
══════════════════════════════════════════ */
function rCaja(){
  const vs=dV(), tv=vs.reduce((s,v)=>s+v.total,0);
  const ef=vs.filter(v=>v.pago==='Efectivo').reduce((s,v)=>s+v.total,0);
  const movs=dCaja();
  const ingresos=movs.filter(m=>m.tipo==='ingreso').reduce((s,m)=>s+m.monto,0);
  const egresos=movs.filter(m=>m.tipo==='egreso').reduce((s,m)=>s+m.monto,0);
  const ga=dG().reduce((s,g)=>s+g.amount,0);
  const cajaEfectivo=ef+movs.filter(m=>m.metodo==='efectivo'&&m.tipo==='ingreso').reduce((s,m)=>s+m.monto,0)
    -movs.filter(m=>m.metodo==='efectivo'&&m.tipo==='egreso').reduce((s,m)=>s+m.monto,0);
  const resultado=tv+ingresos-egresos-ga;

  const opts=S.vr.map(v=>{const g=sgVenta().find(x=>x.id===v.group_id);return`<option value="${v.id}" data-p="${v.price}" data-k="${v.qty_per_unit}">${esc(g?g.name+' › ':'')}${esc(v.name)}</option>`}).join('');

  const vRows=vs.length?vs.map(v=>{
    const vr=S.vr.find(x=>x.id===v.variant_id),gr=S.sg.find(x=>x.id===v.group_id);
    const desc=v.descuento_pct>0?` <span class="tag tc">-${v.descuento_pct}%</span>`:'';
    return`<tr>
      <td>${v.time||''}</td>
      <td style="max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(gr?gr.name:'–')}${vr?' › '+esc(vr.name):''}</td>
      <td>${v.qty}</td><td>${$m(v.total)}${desc}</td>
      <td><span class="tag tv">${(v.pago||'').slice(0,3)}</span></td>
      <td><button class="dbtn" onclick="delV('${v.id}')">✕</button></td>
    </tr>`;
  }).join(''):`<tr><td colspan="6" class="empty-row">Sin ventas</td></tr>`;

  const mRows=movs.length?movs.map(m=>`<tr>
    <td>${m.time||''}</td>
    <td>${esc(m.descripcion)}</td>
    <td><span class="tag ${m.tipo==='ingreso'?'tv':'tg'}">${m.tipo}</span></td>
    <td style="color:${m.tipo==='ingreso'?'var(--gn)':'var(--rd)'}">${m.tipo==='ingreso'?'+':'-'}${$m(m.monto)}</td>
    <td><span class="tag tp">${m.metodo.slice(0,3)}</span></td>
    <td><button class="dbtn" onclick="delMov('${m.id}')">✕</button></td>
  </tr>`).join(''):`<tr><td colspan="6" class="empty-row">Sin movimientos</td></tr>`;

  return`
  <div class="kpis">
    <div class="kc hi"><div class="kl">Ventas</div><div class="kv a">${$m(tv)}</div><div class="kh">${vs.length} reg.</div></div>
    <div class="kc"><div class="kl">Resultado día</div><div class="kv ${resultado>=0?'g':'r'}">${$m(resultado)}</div></div>
    <div class="kc"><div class="kl">Efectivo caja</div><div class="kv">${$m(cajaEfectivo)}</div></div>
    <div class="kc"><div class="kl">Digital</div><div class="kv">${$m(tv-ef)}</div></div>
  </div>

  <div class="blk"><div class="bt">Registrar venta</div>
    <div class="fr">
      <div class="fl" style="flex:3"><label>Variante</label>
        <select id="v-var" onchange="onVC()">${opts||'<option value="">Sin variantes — creá en Stock</option>'}</select>
      </div>
      <div class="fl" style="max-width:58px"><label>Cant.</label>
        <input type="number" id="v-qty" value="1" min="0.1" step="0.1" oninput="calcT()">
      </div>
    </div>
    <div class="fr">
      <div class="fl"><label>Precio unit. $</label><input type="number" id="v-price" placeholder="0" oninput="calcT()"></div>
      <div class="fl" style="max-width:70px"><label>Descuento %</label><input type="number" id="v-desc" placeholder="0" min="0" max="100" oninput="calcT()"></div>
      <div class="fl"><label>Subtotal</label><input type="text" id="v-tot" readonly style="color:var(--ac)"></div>
    </div>
    <div class="fr">
      <div class="fl"><label>−Stock</label><input type="text" id="v-kgd" readonly style="color:var(--tx3);font-size:11px"></div>
      <div class="fl"><label>Pago</label><select id="v-pago"><option>Efectivo</option><option>Transferencia</option><option>Débito</option><option>Crédito</option></select></div>
      <button class="btn btnp" onclick="addV()" style="align-self:flex-end">+ Venta</button>
    </div>
  </div>

  <div class="tbk"><div class="tt">Ventas del día</div>
    <table><thead><tr><th>Hora</th><th>Producto</th><th>Cant</th><th>Total</th><th>Pago</th><th></th></tr></thead>
    <tbody>${vRows}</tbody></table>
  </div>

  <div class="blk"><div class="bt">Movimiento de caja (ingresos / egresos)</div>
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
  </div>`;
}

function onVC(){const s=document.getElementById('v-var'),o=s?.options[s.selectedIndex];if(!o)return;document.getElementById('v-price').value=o.dataset.p||'';calcT();}
function calcT(){
  const s=document.getElementById('v-var'),o=s?.options[s.selectedIndex];
  const k=parseFloat(o?.dataset?.k)||1,q=parseFloat(document.getElementById('v-qty')?.value)||0,p=parseFloat(document.getElementById('v-price')?.value)||0;
  const desc=parseFloat(document.getElementById('v-desc')?.value)||0;
  const total=q*p*(1-desc/100);
  const td2=document.getElementById('v-tot'),kd=document.getElementById('v-kgd');
  if(td2)td2.value=total?$m(total):'';
  const vr=S.vr.find(x=>x.id===s?.value);
  const gr=vr?S.sg.find(x=>x.id===vr.group_id):null;
  if(kd)kd.value=q*k?'−'+(q*k).toFixed(2)+(gr?' '+(gr.unit||'kg'):''):'';
}
async function addV(){
  const s=document.getElementById('v-var'),o=s?.options[s.selectedIndex];
  const varId=s?.value,kpu=parseFloat(o?.dataset?.k)||1,qty=parseFloat(document.getElementById('v-qty').value)||0,price=parseFloat(document.getElementById('v-price').value)||0,pago=document.getElementById('v-pago').value;
  const desc=parseFloat(document.getElementById('v-desc')?.value)||0;
  if(!varId||!qty||!price)return alert('Completá todos los campos');
  const vr=S.vr.find(x=>x.id===varId);if(!vr)return;
  const gr=S.sg.find(x=>x.id===vr.group_id);if(!gr)return;
  const stockUsed=qty*kpu;
  const total=qty*price*(1-desc/100);
  if((gr.stock_qty||0)<stockUsed&&!confirm(`Stock bajo en ${gr.name}: quedan ${(gr.stock_qty||0).toFixed(2)} ${gr.unit||'kg'}. ¿Continuar?`))return;
  const time=arTime();
  const row={id:uid(),day,variant_id:varId,group_id:vr.group_id,qty,stock_used:stockUsed,price_unit:price,descuento_pct:desc,total,pago,time};
  if(!S.ve[day])S.ve[day]=[];S.ve[day].push(row);
  gr.stock_qty=Math.max(0,(gr.stock_qty||0)-stockUsed);
  save();render();
  if(online){sync('busy','guardando...');try{await sbUp('ventas',row);await sbUp('stock_groups',{id:gr.id,name:gr.name,unit:gr.unit,tipo:gr.tipo,stock_qty:gr.stock_qty,cost_unit:gr.cost_unit||0});sync('ok','guardado')}catch(e){sync('err','error')}}
}
async function delV(id){
  const vs=S.ve[day]||[],item=vs.find(x=>x.id===id);
  if(item){const g=S.sg.find(x=>x.id===item.group_id);if(g)g.stock_qty=(g.stock_qty||0)+(item.stock_used||0);}
  S.ve[day]=vs.filter(x=>x.id!==id);save();render();
  if(online){try{await sbDel('ventas',id);const g=S.sg.find(x=>x.id===item?.group_id);if(g)await sbUp('stock_groups',{id:g.id,name:g.name,unit:g.unit,tipo:g.tipo,stock_qty:g.stock_qty,cost_unit:g.cost_unit||0});}catch(e){}}
}
async function addMov(){
  const tipo=document.getElementById('mov-tipo').value,desc=document.getElementById('mov-desc').value.trim(),monto=parseFloat(document.getElementById('mov-monto').value)||0,metodo=document.getElementById('mov-metodo').value;
  if(!desc||!monto)return alert('Completá descripción y monto');
  const row={id:uid(),day,tipo,descripcion:desc,metodo,monto,time:arTime()};
  if(!S.caja[day])S.caja[day]=[];S.caja[day].push(row);save();render();
  if(online){sync('busy','guardando...');try{await sbUp('caja_movimientos',row);sync('ok','guardado')}catch(e){sync('err','error')}}
}
async function delMov(id){S.caja[day]=(S.caja[day]||[]).filter(x=>x.id!==id);save();render();if(online){try{await sbDel('caja_movimientos',id)}catch(e){}}}

/* ══════════════════════════════════════════
   STOCK
══════════════════════════════════════════ */
const UNITS=['kg','unidad','litro','docena','bandeja','bolsa','gramo','paquete'];

function rStock(){
  const low=sgVenta().filter(g=>(g.stock_qty||0)<2);
  const alrt=low.length?`<div class="alrt">⚠ Stock bajo: ${low.map(g=>esc(g.name)+' ('+fmtQty(g.stock_qty,g.unit)+')').join(', ')}</div>`:'';
  const unitOpts=UNITS.map(u=>`<option>${u}</option>`).join('');

  const sgRows=(tipo)=>{
    const items=S.sg.filter(g=>(g.tipo||'venta')===tipo);
    if(!items.length)return`<tr><td colspan="5" class="empty-row">Sin grupos</td></tr>`;
    return items.map(g=>{
      const max=Math.max(...items.map(x=>x.stock_qty||0),1),pct=Math.min(100,Math.round(((g.stock_qty||0)/max)*100));
      const col=(g.stock_qty||0)<2?'var(--rd)':(g.stock_qty||0)<5?'var(--or)':'var(--gn)';
      const vars=S.vr.filter(v=>v.group_id===g.id);
      return`<tr>
        <td>
          <div style="font-size:12px">${esc(g.name)} <span style="font-size:9px;color:var(--tx3);font-family:var(--mo)">${g.unit||'kg'}</span></div>
          ${tipo==='venta'?`<div style="font-size:9px;color:var(--tx3)">${vars.map(v=>esc(v.name)).join(', ')||'sin variantes'}</div>`:''}
          <div class="sb-w"><div class="sb" style="width:${pct}%;background:${col}"></div></div>
        </td>
        <td style="color:${col};font-family:var(--mo);font-weight:500">${fmtQty(g.stock_qty,g.unit)}</td>
        <td><input type="number" class="ip" value="${+(g.stock_qty||0).toFixed(3)}" step="0.1" min="0" onchange="updGS('${g.id}',this.value)"></td>
        ${tipo==='produccion'?`<td><input type="number" class="ip" value="${+(g.cost_unit||0).toFixed(2)}" step="0.01" min="0" onchange="updGCost('${g.id}',this.value)" title="Costo/${g.unit||'kg'}"></td>`:'<td></td>'}
        <td><button class="dbtn" onclick="delG('${g.id}')">✕</button></td>
      </tr>`;
    }).join('');
  };

  const vrRows=sgVenta().map(g=>{
    const vars=S.vr.filter(v=>v.group_id===g.id);if(!vars.length)return'';
    return`<tr style="background:rgba(255,255,255,.01)"><td colspan="4" style="padding:5px 12px;font-size:9px;color:var(--tx3);letter-spacing:.5px;text-transform:uppercase;border-top:1px solid var(--br)">${esc(g.name)} (${g.unit||'kg'})</td></tr>`
      +vars.map(v=>`<tr><td style="padding-left:18px">${esc(v.name)}</td><td style="color:var(--tx3);font-size:11px">descuenta ${v.qty_per_unit} ${g.unit||'kg'}/u</td><td><input type="number" class="ip" value="${v.price||0}" onchange="updVP('${v.id}',this.value)"></td><td><button class="dbtn" onclick="delVr('${v.id}')">✕</button></td></tr>`).join('');
  }).join('');

  const grOptV=sgVenta().map(g=>`<option value="${g.id}">${esc(g.name)} (${g.unit||'kg'})</option>`).join('');

  return`
  ${alrt}
  <div class="sh">Stock de venta</div>
  <div class="blk"><div class="bt">Nuevo grupo de venta</div>
    <div class="fr">
      <div class="fl" style="flex:2"><label>Nombre</label><input type="text" id="sg-n" placeholder="Ej: Cuartos, Milanesas..."></div>
      <div class="fl" style="max-width:90px"><label>Unidad</label><select id="sg-u">${unitOpts}</select></div>
      <div class="fl" style="max-width:75px"><label>Stock inicial</label><input type="number" id="sg-s" placeholder="0" min="0" step="0.1"></div>
    </div>
    <button class="btn btnp" onclick="addG('venta')" style="width:100%;margin-top:4px">+ Crear grupo de venta</button>
  </div>
  <div class="tbk"><div class="tt">Stock de venta — ajustá directo</div>
    <table><thead><tr><th>Grupo</th><th>Stock</th><th>Ajustar</th><th></th><th></th></tr></thead>
    <tbody>${sgRows('venta')}</tbody></table>
  </div>

  <div class="sh">Variantes de venta</div>
  <div class="blk"><div class="bt">Nueva variante</div>
    <div class="fr">
      <div class="fl"><label>Grupo</label><select id="vr-g">${grOptV||'<option>Sin grupos</option>'}</select></div>
      <div class="fl" style="flex:2"><label>Nombre variante</label><input type="text" id="vr-n" placeholder="Ej: Cuarto x kg, Oferta 3kg..."></div>
    </div>
    <div class="fr">
      <div class="fl"><label>Cantidad que descuenta</label><input type="number" id="vr-k" placeholder="Ej: 1, 3, 0.35" min="0.001" step="0.001"></div>
      <div class="fl"><label>Precio $</label><input type="number" id="vr-p" placeholder="0"></div>
      <button class="btn btnp" onclick="addVr()" style="align-self:flex-end">+ Crear</button>
    </div>
    <div style="font-size:9px;color:var(--tx3);font-family:var(--mo);margin-top:3px">Ej: "Pata" descuenta 0.35kg del grupo Cuartos</div>
  </div>
  <div class="tbk"><div class="tt">Variantes — editá precio directo</div>
    <table><thead><tr><th>Variante</th><th>Descuenta</th><th>Precio $</th><th></th></tr></thead>
    <tbody>${vrRows||`<tr><td colspan="4" class="empty-row">Sin variantes</td></tr>`}</tbody>
  </div>

  <div class="sh">Stock de producción (materias primas)</div>
  <div class="blk"><div class="bt">Nuevo ítem de producción</div>
    <div class="fr">
      <div class="fl" style="flex:2"><label>Nombre</label><input type="text" id="sgp-n" placeholder="Ej: Pollo para producción..."></div>
      <div class="fl" style="max-width:90px"><label>Unidad</label><select id="sgp-u">${unitOpts}</select></div>
    </div>
    <div class="fr">
      <div class="fl" style="max-width:90px"><label>Stock inicial</label><input type="number" id="sgp-s" placeholder="0" min="0" step="0.1"></div>
      <div class="fl"><label>Costo por unidad $</label><input type="number" id="sgp-c" placeholder="0" step="0.01"></div>
      <button class="btn btnp" onclick="addG('produccion')" style="align-self:flex-end">+ Crear</button>
    </div>
  </div>
  <div class="tbk"><div class="tt">Stock producción — editá costo directo</div>
    <table><thead><tr><th>Materia prima</th><th>Stock</th><th>Ajustar</th><th>Costo/u</th><th></th></tr></thead>
    <tbody>${sgRows('produccion')}</tbody>
  </div>`;
}

async function addG(tipo){
  const nEl=document.getElementById(tipo==='produccion'?'sgp-n':'sg-n');
  const uEl=document.getElementById(tipo==='produccion'?'sgp-u':'sg-u');
  const sEl=document.getElementById(tipo==='produccion'?'sgp-s':'sg-s');
  const cEl=tipo==='produccion'?document.getElementById('sgp-c'):null;
  const n=nEl?.value.trim(),u=uEl?.value||'kg',s=parseFloat(sEl?.value)||0,c=parseFloat(cEl?.value)||0;
  if(!n)return alert('Ingresá un nombre');
  if(S.sg.find(g=>g.name===n&&(g.tipo||'venta')===tipo))return alert('Ya existe');
  const row={id:uid(),name:n,unit:u,stock_qty:s,tipo,cost_unit:c};
  S.sg.push(row);save();render();
  if(online){try{await sbUp('stock_groups',row);sync('ok','guardado')}catch(e){sync('err','error')}}
}
async function updGS(id,v){const g=S.sg.find(x=>x.id===id);if(!g)return;g.stock_qty=parseFloat(v)||0;save();toast('Stock actualizado ✓');if(online){try{await sbUp('stock_groups',{id:g.id,name:g.name,unit:g.unit,tipo:g.tipo,stock_qty:g.stock_qty,cost_unit:g.cost_unit||0});sync('ok','guardado')}catch(e){sync('err','error')}}}
async function updGCost(id,v){const g=S.sg.find(x=>x.id===id);if(!g)return;g.cost_unit=parseFloat(v)||0;save();toast('Costo actualizado ✓');if(online){try{await sbUp('stock_groups',{id:g.id,name:g.name,unit:g.unit,tipo:g.tipo,stock_qty:g.stock_qty,cost_unit:g.cost_unit});sync('ok','guardado')}catch(e){sync('err','error')}}}
async function delG(id){if(!confirm('¿Eliminar grupo?'))return;S.sg=S.sg.filter(x=>x.id!==id);S.vr=S.vr.filter(x=>x.group_id!==id);save();render();if(online){try{await sbDel('stock_groups',id)}catch(e){}}}
async function addVr(){const gid=document.getElementById('vr-g').value,n=document.getElementById('vr-n').value.trim(),k=parseFloat(document.getElementById('vr-k').value)||0,p=parseFloat(document.getElementById('vr-p').value)||0;if(!gid||!n||!k)return alert('Completá todos los campos');const row={id:uid(),group_id:gid,name:n,qty_per_unit:k,price:p};S.vr.push(row);save();render();if(online){try{await sbUp('stock_variants',row);sync('ok','guardado')}catch(e){sync('err','error')}}}
async function updVP(id,v){const vr=S.vr.find(x=>x.id===id);if(!vr)return;vr.price=parseFloat(v)||0;save();toast('Precio actualizado ✓');if(online){try{await sbUp('stock_variants',{id:vr.id,group_id:vr.group_id,name:vr.name,qty_per_unit:vr.qty_per_unit,price:vr.price});sync('ok','guardado')}catch(e){sync('err','error')}}}
async function delVr(id){S.vr=S.vr.filter(x=>x.id!==id);save();render();if(online){try{await sbDel('stock_variants',id)}catch(e){}}}

/* ══════════════════════════════════════════
   PRODUCCIÓN
══════════════════════════════════════════ */
function rProd(){
  const todP=S.pr.filter(p=>p.day===day||p.date===day);
  const sgVOpts=sgVenta().map(g=>`<option value="${g.id}">${esc(g.name)} (${g.unit||'kg'})</option>`).join('');
  const insRows=S.ins.length?S.ins.map(i=>`<tr><td>${esc(i.name)}</td><td><input type="number" class="ip" value="${i.costUnit||0}" onchange="updIns('${i.id}',this.value)"></td><td style="color:var(--tx3)">${i.unit}</td><td><button class="dbtn" onclick="delIns('${i.id}')">✕</button></td></tr>`).join(''):`<tr><td colspan="4" class="empty-row">Sin insumos</td></tr>`;

  const lotRows=todP.length?todP.map(p=>{
    const outG=S.sg.find(x=>x.id===p.output_group_id);
    const items=S.pri.filter(i=>i.produccion_id===p.id);
    const itemList=items.map(i=>`<div style="font-size:10px;color:var(--tx3);padding:2px 0">${esc(i.nombre)}: ${fmtQty(i.qty,i.unit)} — ${$m(i.costo_total||0)}</div>`).join('');
    return`<div class="blk" style="margin-bottom:8px;padding:10px 12px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div><div style="font-size:13px;font-weight:600">${esc(p.nombre)}</div>
          <div style="font-size:10px;color:var(--tx3);font-family:var(--mo);margin-top:2px">${p.time||''} ${outG?'→ '+outG.name+' +'+fmtQty(p.output_qty,outG.unit):''}</div>
        </div>
        <div style="text-align:right"><div style="font-size:12px;font-family:var(--mo);color:var(--ac)">Costo: ${$m(p.costo_total||0)}</div>
          <button class="dbtn" onclick="delLote('${p.id}')" style="margin-top:4px">✕</button></div>
      </div>
      ${itemList?`<div style="margin-top:5px;border-top:1px solid var(--br);padding-top:5px">${itemList}</div>`:''}
      ${p.note?`<div style="font-size:10px;color:var(--tx3);margin-top:3px">${esc(p.note)}</div>`:''}
    </div>`;
  }).join(''):`<div class="empty-row">Sin producción registrada hoy</div>`;

  return`
  <div class="sh">Nuevo lote de producción</div>
  <div class="blk"><div class="bt">Datos del lote</div>
    <div class="fr">
      <div class="fl" style="flex:2"><label>Nombre</label><input type="text" id="lot-n" placeholder="Ej: Milanesas mañana, Corte tarde..."></div>
      <div class="fl"><label>Nota</label><input type="text" id="lot-note" placeholder=""></div>
    </div>
    <div class="fr">
      <div class="fl" style="flex:2"><label>Resultado → ingresa a stock de venta</label><select id="lot-outg"><option value="">No ingresa a stock</option>${sgVOpts}</select></div>
      <div class="fl" style="max-width:80px"><label>Cantidad</label><input type="number" id="lot-outqty" placeholder="0" min="0" step="0.1"></div>
    </div>
  </div>
  <div class="blk"><div class="bt">Ingredientes del lote</div>
    <div id="lot-items-list"></div>
    <div class="fr" style="margin-top:8px">
      <div class="fl" style="max-width:110px"><label>Tipo</label><select id="li-tipo" onchange="onLiTipo()"><option value="stock_prod">Stock prod.</option><option value="insumo">Insumo</option></select></div>
      <div class="fl" style="flex:2"><label>Item</label><select id="li-item"></select></div>
      <div class="fl" style="max-width:65px"><label>Cantidad</label><input type="number" id="li-qty" placeholder="0" min="0.001" step="0.001"></div>
      <button class="btn" onclick="addLotItem()" style="align-self:flex-end;padding:6px 10px;font-size:11px">+</button>
    </div>
    <button class="btn btnp" onclick="saveLote()" style="width:100%;margin-top:8px">✓ Guardar lote</button>
  </div>
  <div class="sh">Producción de hoy</div>
  ${lotRows}
  <div class="sh">Insumos (harina, aceite, etc.)</div>
  <div class="blk"><div class="bt">Agregar insumo</div>
    <div class="fr"><div class="fl" style="flex:2"><label>Nombre</label><input type="text" id="ins-n" placeholder="Ej: Harina, Aceite..."></div><div class="fl" style="max-width:75px"><label>Unidad</label><select id="ins-u"><option>kg</option><option>litro</option><option>unidad</option><option>bolsa</option></select></div></div>
    <div class="fr"><div class="fl"><label>Costo/unidad $</label><input type="number" id="ins-c" placeholder="0"></div><button class="btn btnp" onclick="addIns()" style="align-self:flex-end">+ Agregar</button></div>
  </div>
  <div class="tbk"><div class="tt">Insumos — editá costo directo</div>
    <table><thead><tr><th>Insumo</th><th>Costo $</th><th>Unidad</th><th></th></tr></thead><tbody>${insRows}</tbody></table>
  </div>`;
}

function onLiTipo(){
  const t=document.getElementById('li-tipo')?.value,s=document.getElementById('li-item');if(!s)return;
  if(t==='stock_prod')s.innerHTML=sgProd().map(g=>`<option value="${g.id}" data-cu="${g.cost_unit||0}" data-u="${g.unit||'kg'}">${esc(g.name)} (${$d2(g.cost_unit||0)}/${g.unit||'kg'})</option>`).join('')||'<option>Sin stock prod.</option>';
  else s.innerHTML=S.ins.map(i=>`<option value="${i.id}" data-cu="${i.costUnit||0}" data-u="${i.unit}">${esc(i.name)} (${$d2(i.costUnit||0)}/${i.unit})</option>`).join('')||'<option>Sin insumos</option>';
}
function renderLotItems(){
  onLiTipo();
  const list=document.getElementById('lot-items-list');if(!list)return;
  if(!lotItems.length){list.innerHTML=`<div style="font-size:11px;color:var(--tx3);font-family:var(--mo);padding:4px 0">Sin ingredientes</div>`;return;}
  const cT=lotItems.reduce((s,x)=>s+x.costo_total,0);
  list.innerHTML=lotItems.map((x,i)=>`<div class="pvi"><div><div class="pvn">${esc(x.nombre)} <span class="tag ${x.tipo==='stock_prod'?'tp':'tc'}">${x.tipo==='stock_prod'?'stock':'insumo'}</span></div><div class="pvd">${fmtQty(x.qty,x.unit)} × ${$d2(x.costo_unit)} = ${$m(x.costo_total)}</div></div><button class="dbtn" onclick="rmLotItem(${i})">✕</button></div>`).join('')
    +`<div style="text-align:right;font-size:12px;font-family:var(--mo);color:var(--ac);padding:6px 0;border-top:1px solid var(--br);margin-top:4px">Costo total: ${$m(cT)}</div>`;
}
function addLotItem(){
  const tipo=document.getElementById('li-tipo')?.value,sel=document.getElementById('li-item'),opt=sel?.options[sel.selectedIndex],itemId=sel?.value,qty=parseFloat(document.getElementById('li-qty')?.value)||0;
  if(!itemId||!qty)return alert('Seleccioná item y cantidad');
  const cu=parseFloat(opt?.dataset?.cu)||0,unit=opt?.dataset?.u||'kg';
  let nombre='';
  if(tipo==='stock_prod'){const g=sgProd().find(x=>x.id===itemId);nombre=g?g.name:itemId;}
  else{const i=S.ins.find(x=>x.id===itemId);nombre=i?i.name:itemId;}
  lotItems.push({tipo,ref_id:itemId,nombre,qty,unit,costo_unit:cu,costo_total:qty*cu});
  document.getElementById('li-qty').value='';
  renderLotItems();
}
function rmLotItem(i){lotItems.splice(i,1);renderLotItems();}
async function saveLote(){
  const nom=document.getElementById('lot-n')?.value.trim(),note=document.getElementById('lot-note')?.value.trim(),outGid=document.getElementById('lot-outg')?.value,outQty=parseFloat(document.getElementById('lot-outqty')?.value)||0;
  if(!nom)return alert('Ingresá un nombre para el lote');
  if(!lotItems.length)return alert('Agregá al menos un ingrediente');
  const costoTotal=lotItems.reduce((s,x)=>s+x.costo_total,0);
  const loteId=uid();
  const lote={id:loteId,day,date:day,nombre:nom,output_group_id:outGid||null,output_qty:outQty,costo_total:costoTotal,note,time:arTime()};
  const items=lotItems.map(x=>({id:uid(),produccion_id:loteId,tipo:x.tipo,ref_id:x.ref_id,nombre:x.nombre,qty:x.qty,unit:x.unit,costo_unit:x.costo_unit,costo_total:x.costo_total}));
  lotItems.forEach(x=>{if(x.tipo==='stock_prod'){const g=S.sg.find(sg=>sg.id===x.ref_id);if(g)g.stock_qty=Math.max(0,(g.stock_qty||0)-x.qty);}});
  if(outGid&&outQty>0){const og=S.sg.find(x=>x.id===outGid);if(og)og.stock_qty=(og.stock_qty||0)+outQty;}
  S.pr.push(lote);S.pri.push(...items);lotItems=[];save();render();
  if(online){sync('busy','guardando...');try{
    await sbUp('produccion',{id:lote.id,day:lote.day,nombre:lote.nombre,output_group_id:lote.output_group_id,output_qty:lote.output_qty,costo_total:lote.costo_total,note:lote.note,time:lote.time});
    if(items.length)await sbUp('produccion_items',items);
    const changed=[...new Set([...(lote.output_group_id?[lote.output_group_id]:[]),...items.filter(x=>x.tipo==='stock_prod').map(x=>x.ref_id)])];
    for(const gid of changed){const g=S.sg.find(x=>x.id===gid);if(g)await sbUp('stock_groups',{id:g.id,name:g.name,unit:g.unit,tipo:g.tipo,stock_qty:g.stock_qty,cost_unit:g.cost_unit||0});}
    sync('ok','guardado');
  }catch(e){sync('err','error');console.error(e)}}
}
async function delLote(id){
  if(!confirm('¿Eliminar este lote?'))return;
  const lote=S.pr.find(x=>x.id===id);
  if(lote){const items=S.pri.filter(x=>x.produccion_id===id);items.forEach(x=>{if(x.tipo==='stock_prod'){const g=S.sg.find(sg=>sg.id===x.ref_id);if(g)g.stock_qty=(g.stock_qty||0)+x.qty;}});if(lote.output_group_id&&lote.output_qty){const og=S.sg.find(x=>x.id===lote.output_group_id);if(og)og.stock_qty=Math.max(0,(og.stock_qty||0)-lote.output_qty);}}
  S.pr=S.pr.filter(x=>x.id!==id);S.pri=S.pri.filter(x=>x.produccion_id!==id);save();render();
  if(online){try{await sbDel('produccion',id);}catch(e){}}
}
async function addIns(){const n=document.getElementById('ins-n')?.value.trim(),u=document.getElementById('ins-u')?.value,c=parseFloat(document.getElementById('ins-c')?.value)||0;if(!n||!c)return alert('Completá nombre y costo');if(S.ins.find(i=>i.name===n))return alert('Ya existe');const row={id:uid(),name:n,unit:u,costUnit:c,cost_unit:c};S.ins.push(row);save();render();if(online){try{await sbUp('insumos',{id:row.id,name:row.name,unit:row.unit,cost_unit:row.costUnit});sync('ok','guardado')}catch(e){sync('err','error')}}}
async function updIns(id,v){const i=S.ins.find(x=>x.id===id);if(!i)return;i.costUnit=parseFloat(v)||0;i.cost_unit=i.costUnit;save();toast('Costo actualizado ✓');if(online){try{await sbUp('insumos',{id:i.id,name:i.name,unit:i.unit,cost_unit:i.costUnit});sync('ok','guardado')}catch(e){sync('err','error')}}}
async function delIns(id){S.ins=S.ins.filter(x=>x.id!==id);save();render();if(online){try{await sbDel('insumos',id)}catch(e){}}}

/* ══════════════════════════════════════════
   COMPRAS / FACTURAS DE PROVEEDORES
══════════════════════════════════════════ */
function rCompras(){
  const todC=S.co.filter(c=>c.day===day);
  const sgPrOpts=sgProd().map(g=>`<option value="${g.id}" data-u="${g.unit||'kg'}">${esc(g.name)} (${g.unit||'kg'})</option>`).join('');
  const insOpts=S.ins.map(i=>`<option value="${i.id}" data-u="${i.unit}">${esc(i.name)} (${i.unit})</option>`).join('');
  const allSgOpts=`<optgroup label="Stock de producción">${sgPrOpts||'<option disabled>Sin stock prod.</option>'}</optgroup><optgroup label="Insumos">${insOpts||'<option disabled>Sin insumos</option>'}</optgroup>`;

  const comprasRows=todC.length?todC.map(c=>{
    const items=S.coi.filter(i=>i.compra_id===c.id);
    return`<div class="blk" style="margin-bottom:8px;padding:10px 12px">
      <div style="display:flex;justify-content:space-between">
        <div><div style="font-size:13px;font-weight:600">${esc(c.proveedor)}</div>
          <div style="font-size:10px;color:var(--tx3);font-family:var(--mo)">${c.time||''} ${c.nro_factura?'· Fact. '+esc(c.nro_factura):''}</div>
        </div>
        <div style="text-align:right"><div style="font-size:13px;font-family:var(--mo);color:var(--ac)">${$m(c.total)}</div>
          <button class="dbtn" onclick="delCompra('${c.id}')" style="margin-top:3px">✕</button>
        </div>
      </div>
      ${items.length?`<div style="margin-top:6px;border-top:1px solid var(--br);padding-top:6px">${items.map(i=>`<div style="font-size:10px;color:var(--tx2);padding:2px 0">${esc(i.descripcion)}: ${i.qty_compra} ${i.unit_compra||''} ${i.qty_real?'→ '+i.qty_real+' '+i.unit_real:''}  — ${$m(i.precio_total)} ${i.cost_unit_calculado?'('+$d2(i.cost_unit_calculado)+'/'+i.unit_real+')':''}</div>`).join('')}</div>`:''}
      ${c.note?`<div style="font-size:10px;color:var(--tx3);margin-top:3px">${esc(c.note)}</div>`:''}
    </div>`;
  }).join(''):`<div class="empty-row">Sin compras registradas hoy</div>`;

  return`
  <div class="info-box">💡 Al guardar la factura, el stock y los costos se actualizan automáticamente.</div>
  <div class="sh">Nueva factura de proveedor</div>
  <div class="blk"><div class="bt">Datos de la factura</div>
    <div class="fr">
      <div class="fl" style="flex:2"><label>Proveedor</label><input type="text" id="cp-prov" placeholder="Ej: Avícola Don Juan"></div>
      <div class="fl" style="max-width:110px"><label>Nro. Factura</label><input type="text" id="cp-fact" placeholder="opcional"></div>
    </div>
    <div class="fr">
      <div class="fl"><label>Nota</label><input type="text" id="cp-note" placeholder=""></div>
    </div>
  </div>
  <div class="blk"><div class="bt">Artículos de la factura</div>
    <div id="cp-items-list"></div>
    <div class="sep"></div>
    <div style="font-size:9px;color:var(--tx2);font-family:var(--mo);margin-bottom:8px">AGREGAR ARTÍCULO</div>
    <div class="fr">
      <div class="fl" style="flex:2"><label>Descripción</label><input type="text" id="ci-desc" placeholder="Ej: Cajón pollo, Pan rallado..."></div>
      <div class="fl"><label>Actualiza</label><select id="ci-ref">${allSgOpts}</select></div>
    </div>
    <div class="fr">
      <div class="fl" style="max-width:70px"><label>Cant. compra</label><input type="number" id="ci-qtyc" placeholder="4" min="0.001" step="0.001"></div>
      <div class="fl" style="max-width:90px"><label>Unidad compra</label><input type="text" id="ci-uc" placeholder="cajón, bolsa..."></div>
      <div class="fl" style="max-width:70px"><label>Cant. real</label><input type="number" id="ci-qtyr" placeholder="74" min="0.001" step="0.001" title="Cantidad en la unidad del stock. Ej: kg reales del cajón"></div>
      <div class="fl" style="max-width:80px"><label>Precio total $</label><input type="number" id="ci-precio" placeholder="0"></div>
      <button class="btn" onclick="addCompraItem()" style="align-self:flex-end;padding:6px 10px;font-size:11px">+</button>
    </div>
    <div style="font-size:9px;color:var(--tx3);font-family:var(--mo);margin-top:3px">
      "Cant. real" = cantidad en la unidad del stock. Ej: comprás 4 cajones que = 74kg → real: 74
    </div>
    <button class="btn btnp" onclick="saveCompra()" style="width:100%;margin-top:10px">✓ Guardar factura</button>
  </div>
  <div class="sh">Compras de hoy</div>
  ${comprasRows}`;
}

function renderCompraItems(){
  const list=document.getElementById('cp-items-list');if(!list)return;
  if(!compraItems.length){list.innerHTML='';return;}
  const tot=compraItems.reduce((s,x)=>s+x.precio_total,0);
  list.innerHTML=compraItems.map((x,i)=>`<div class="compra-item">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div><div style="font-size:12px;font-weight:500">${esc(x.descripcion)}</div>
        <div style="font-size:10px;color:var(--tx3);font-family:var(--mo)">${x.qty_compra} ${x.unit_compra||''} ${x.qty_real?'→ '+x.qty_real+' '+x.unit_real:''}</div>
        <div style="font-size:10px;color:var(--tx2);font-family:var(--mo)">${$m(x.precio_total)} ${x.cost_unit_calculado?'· '+$d2(x.cost_unit_calculado)+'/'+x.unit_real:''}</div>
      </div>
      <button class="dbtn" onclick="rmCompraItem(${i})">✕</button>
    </div>
  </div>`).join('')
  +`<div style="text-align:right;font-size:12px;font-family:var(--mo);color:var(--ac);padding:6px 0">Total factura: ${$m(tot)}</div>`;
}
function addCompraItem(){
  const desc=document.getElementById('ci-desc')?.value.trim();
  const refEl=document.getElementById('ci-ref');
  const refOpt=refEl?.options[refEl.selectedIndex];
  const refId=refEl?.value;
  const qtyC=parseFloat(document.getElementById('ci-qtyc')?.value)||0;
  const uc=document.getElementById('ci-uc')?.value.trim()||'unidad';
  const qtyR=parseFloat(document.getElementById('ci-qtyr')?.value)||0;
  const precio=parseFloat(document.getElementById('ci-precio')?.value)||0;
  if(!desc||!qtyC||!precio)return alert('Completá descripción, cantidad y precio');
  const unitReal=refOpt?.dataset?.u||'kg';
  const costCalc=qtyR>0?precio/qtyR:precio/qtyC;
  // determine tipo
  const isStock=sgProd().some(g=>g.id===refId);
  compraItems.push({descripcion:desc,tipo_destino:isStock?'stock_prod':'insumo',ref_id:refId,qty_compra:qtyC,unit_compra:uc,qty_real:qtyR||qtyC,unit_real:unitReal,precio_total:precio,cost_unit_calculado:costCalc});
  document.getElementById('ci-desc').value='';document.getElementById('ci-qtyc').value='';document.getElementById('ci-qtyr').value='';document.getElementById('ci-precio').value='';
  renderCompraItems();
}
function rmCompraItem(i){compraItems.splice(i,1);renderCompraItems();}
async function saveCompra(){
  const prov=document.getElementById('cp-prov')?.value.trim();
  const fact=document.getElementById('cp-fact')?.value.trim();
  const note=document.getElementById('cp-note')?.value.trim();
  if(!prov)return alert('Ingresá el proveedor');
  if(!compraItems.length)return alert('Agregá al menos un artículo');
  const total=compraItems.reduce((s,x)=>s+x.precio_total,0);
  const compraId=uid();
  const compra={id:compraId,day,proveedor:prov,nro_factura:fact||null,total,note:note||null,time:arTime()};
  const items=compraItems.map(x=>({id:uid(),compra_id:compraId,...x}));
  // actualizar stock y costos
  items.forEach(x=>{
    if(x.tipo_destino==='stock_prod'){
      const g=S.sg.find(sg=>sg.id===x.ref_id);
      if(g){g.stock_qty=(g.stock_qty||0)+(x.qty_real||x.qty_compra);g.cost_unit=x.cost_unit_calculado||g.cost_unit;}
    } else if(x.tipo_destino==='insumo'){
      const ins=S.ins.find(i=>i.id===x.ref_id);
      if(ins){ins.costUnit=x.cost_unit_calculado||ins.costUnit;ins.cost_unit=ins.costUnit;}
    }
  });
  // también cargar como gasto
  const gastoRow={id:uid(),day,descripcion:'Compra: '+prov+(fact?' F/'+fact:''),cat:'Materia prima',amount:total,time:arTime()};
  if(!S.ga[day])S.ga[day]=[];S.ga[day].push(gastoRow);
  S.co.push(compra);S.coi.push(...items);compraItems=[];save();render();
  if(online){sync('busy','guardando...');try{
    await sbUp('compras',compra);
    if(items.length)await sbUp('compras_items',items);
    await sbUp('gastos',gastoRow);
    const changed=[...new Set(items.map(x=>x.ref_id))];
    for(const id of changed){
      const g=S.sg.find(x=>x.id===id);if(g)await sbUp('stock_groups',{id:g.id,name:g.name,unit:g.unit,tipo:g.tipo,stock_qty:g.stock_qty,cost_unit:g.cost_unit||0});
      const ins=S.ins.find(x=>x.id===id);if(ins)await sbUp('insumos',{id:ins.id,name:ins.name,unit:ins.unit,cost_unit:ins.costUnit});
    }
    sync('ok','guardado');
  }catch(e){sync('err','error');console.error(e)}}
}
async function delCompra(id){
  if(!confirm('¿Eliminar esta factura?'))return;
  S.co=S.co.filter(x=>x.id!==id);S.coi=S.coi.filter(x=>x.compra_id!==id);save();render();
  if(online){try{await sbDel('compras',id);}catch(e){}}
}

/* ══════════════════════════════════════════
   GASTOS
══════════════════════════════════════════ */
function rGastos(){
  const gs=dG(),tot=gs.reduce((s,g)=>s+g.amount,0);
  const cats={};gs.forEach(g=>{cats[g.cat]=(cats[g.cat]||0)+g.amount});
  const cH=Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--br)"><span style="font-size:11px;color:var(--tx2)">${c}</span><span style="font-family:var(--mo);font-size:12px">${$m(v)}</span></div>`).join('');
  const rows=gs.length?gs.map(g=>`<tr><td>${g.time||''}</td><td style="max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(g.descripcion)}</td><td><span class="tag tg">${(g.cat||'').slice(0,5)}</span></td><td>${$m(g.amount)}</td><td><button class="dbtn" onclick="delGa('${g.id}')">✕</button></td></tr>`).join(''):`<tr><td colspan="5" class="empty-row">Sin gastos</td></tr>`;
  return`<div class="kpis"><div class="kc hi"><div class="kl">Total gastos</div><div class="kv r">${$m(tot)}</div><div class="kh">${gs.length} registros</div></div></div>
  ${Object.keys(cats).length?`<div class="blk"><div class="bt">Por categoría</div>${cH}</div>`:''}
  <div class="blk"><div class="bt">Registrar gasto</div>
    <div class="fr"><div class="fl" style="flex:2"><label>Descripción</label><input type="text" id="g-d" placeholder="Ej: Gas, bolsas, personal..."></div><div class="fl"><label>Categoría</label><select id="g-c"><option>Materia prima</option><option>Servicios</option><option>Personal</option><option>Embalaje</option><option>Limpieza</option><option>Otros</option></select></div></div>
    <div class="fr"><div class="fl"><label>Monto $</label><input type="number" id="g-a" placeholder="0"></div><button class="btn btnp" onclick="addGa()" style="align-self:flex-end">+ Agregar</button></div>
  </div>
  <div class="tbk"><div class="tt">Gastos del día</div>
    <table><thead><tr><th>Hora</th><th>Descripción</th><th>Cat.</th><th>Monto</th><th></th></tr></thead><tbody>${rows}</tbody></table>
  </div>`;
}
async function addGa(){const d2=document.getElementById('g-d').value.trim(),c=document.getElementById('g-c').value,a=parseFloat(document.getElementById('g-a').value)||0;if(!d2||!a)return alert('Completá descripción y monto');const row={id:uid(),day,descripcion:d2,cat:c,amount:a,time:arTime()};if(!S.ga[day])S.ga[day]=[];S.ga[day].push(row);save();render();if(online){sync('busy','guardando...');try{await sbUp('gastos',row);sync('ok','guardado')}catch(e){sync('err','error')}}}
async function delGa(id){S.ga[day]=(S.ga[day]||[]).filter(x=>x.id!==id);save();render();if(online){try{await sbDel('gastos',id)}catch(e){}}}

/* ══════════════════════════════════════════
   REPORTES
══════════════════════════════════════════ */
function getMths(){const s=new Set();Object.keys(S.ve).forEach(d=>s.add(d.slice(0,7)));Object.keys(S.ga).forEach(d=>s.add(d.slice(0,7)));return[...s].sort((a,b)=>b.localeCompare(a))}

function mData(ym){
  const vs=Object.entries(S.ve).filter(([d])=>d.startsWith(ym)).flatMap(([,v])=>v);
  const tv=vs.reduce((s,v)=>s+v.total,0);
  const byG={};
  vs.forEach(v=>{const g=S.sg.find(x=>x.id===v.group_id),gn=g?g.name:'Otros';if(!byG[gn])byG[gn]={qty:0,tot:0,cnt:0,unit:g?.unit||'kg'};byG[gn].qty+=(v.stock_used||0);byG[gn].tot+=v.total;byG[gn].cnt+=v.qty;});
  const tg=Object.entries(S.ga).filter(([d])=>d.startsWith(ym)).flatMap(([,g])=>g).reduce((s,g)=>s+g.amount,0);
  const cpProd=S.pr.filter(p=>(p.day||p.date||'').startsWith(ym)).reduce((s,p)=>s+p.costo_total,0);
  const movs=Object.entries(S.caja).filter(([d])=>d.startsWith(ym)).flatMap(([,m])=>m);
  const ingresos=movs.filter(m=>m.tipo==='ingreso').reduce((s,m)=>s+m.monto,0);
  const egresos=movs.filter(m=>m.tipo==='egreso').reduce((s,m)=>s+m.monto,0);
  return{vs,tv,tg,byG,cpProd,ingresos,egresos};
}

function dayData(d){
  const vs=S.ve[d]||[],tv=vs.reduce((s,v)=>s+v.total,0);
  const byG={};
  vs.forEach(v=>{const g=S.sg.find(x=>x.id===v.group_id),gn=g?g.name:'Otros';if(!byG[gn])byG[gn]={qty:0,tot:0,unit:g?.unit||'kg'};byG[gn].qty+=(v.stock_used||0);byG[gn].tot+=v.total;});
  const tg=(S.ga[d]||[]).reduce((s,g)=>s+g.amount,0);
  return{vs,tv,byG,tg};
}

function yrData(yr){const ms=[];for(let m=1;m<=12;m++){const ym=yr+'-'+m.toString().padStart(2,'0');const{tv,tg,cpProd}=mData(ym);ms.push({ym,lbl:fM(ym).split(' ')[0],tv,tg,cp:cpProd,res:tv-tg-cpProd})}return ms}

function rReportes(){
  const mths=getMths();if(!mths.includes(rMonth)&&mths.length)rMonth=mths[0];
  const yr=rMonth.split('-')[0];
  const tabs=mths.length?mths.map(m=>`<button class="mtab ${m===rMonth?'active':''}" onclick="setRM('${m}')">${fM(m)}</button>`).join(''):`<span style="font-size:10px;color:var(--tx3);font-family:var(--mo)">Sin datos aún</span>`;
  const rtabs=`<div class="mtabs" style="margin-bottom:8px">
    <button class="mtab ${rTab==='dia'?'active':''}" onclick="setRTab('dia')">📅 Día</button>
    <button class="mtab ${rTab==='mes'?'active':''}" onclick="setRTab('mes')">📆 Mes</button>
    <button class="mtab ${rTab==='anual'?'active':''}" onclick="setRTab('anual')">📈 Anual</button>
    <button class="mtab ${rTab==='financiero'?'active':''}" onclick="setRTab('financiero')">💹 Financiero</button>
  </div>`;

  if(rTab==='dia') return rtabs+rRepDia();
  if(rTab==='mes') return rtabs+rRepMes(tabs,rMonth);
  if(rTab==='anual') return rtabs+rRepAnual(yr);
  if(rTab==='financiero') return rtabs+rRepFinanciero(tabs,rMonth);
  return '';
}
function setRM(m){rMonth=m;go('reportes')}
function setRTab(t){rTab=t;go('reportes')}

function rRepDia(){
  const{vs,tv,byG,tg}=dayData(day);
  const res=tv-tg;
  const bgRows=Object.entries(byG).sort((a,b)=>b[1].tot-a[1].tot).map(([n,d])=>`<tr><td>${esc(n)}</td><td style="font-family:var(--mo)">${fmtQty(d.qty,d.unit)}</td><td style="font-family:var(--mo)">${$m(d.tot)}</td><td style="font-family:var(--mo);color:var(--tx3)">${Math.round(tv>0?(d.tot/tv)*100:0)}%</td></tr>`).join('')||`<tr><td colspan="4" class="empty-row">Sin ventas</td></tr>`;
  return`
  <div style="font-size:11px;color:var(--tx2);font-family:var(--mo);margin-bottom:10px">📅 ${fDL(day)}</div>
  <div class="kpis t3">
    <div class="kc hi"><div class="kl">Ventas</div><div class="kv a">${$m(tv)}</div></div>
    <div class="kc"><div class="kl">Gastos</div><div class="kv r">${$m(tg)}</div></div>
    <div class="kc"><div class="kl">Resultado</div><div class="kv ${res>=0?'g':'r'}">${$m(res)}</div></div>
  </div>
  <div class="tbk"><div class="tt">Ventas por grupo — ${fDL(day)}</div>
    <table><thead><tr><th>Grupo</th><th>Cantidad</th><th>Total $</th><th>% del día</th></tr></thead><tbody>${bgRows}</tbody></table>
  </div>
  <div style="margin-top:10px"><button class="btn btng" onclick="exportExcel()" style="width:100%">⬇ Exportar todo a Excel</button></div>`;
}

function rRepMes(tabs,ym){
  const{tv,tg,byG,cpProd}=mData(ym);const res=tv-tg-cpProd;
  const yr=ym.split('-')[0];const mo=parseInt(ym.split('-')[1]);const dc=new Date(+yr,mo,0).getDate();
  const bgRows=Object.entries(byG).sort((a,b)=>b[1].tot-a[1].tot).map(([n,d])=>`<tr><td>${esc(n)}</td><td style="font-family:var(--mo)">${fmtQty(d.qty,d.unit)}</td><td style="font-family:var(--mo)">${$m(d.tot)}</td><td style="font-family:var(--mo);color:var(--tx3)">${Math.round(tv>0?(d.tot/tv)*100:0)}%</td></tr>`).join('')||`<tr><td colspan="4" class="empty-row">Sin datos</td></tr>`;
  return`
  <div class="mtabs">${tabs}</div>
  <div class="kpis t3">
    <div class="kc hi"><div class="kl">Ventas</div><div class="kv a">${$m(tv)}</div></div>
    <div class="kc"><div class="kl">Gastos</div><div class="kv r">${$m(tg)}</div></div>
    <div class="kc"><div class="kl">Resultado</div><div class="kv ${res>=0?'g':'r'}">${$m(res)}</div></div>
  </div>
  <div class="blk"><div class="bt">Ventas diarias — ${fM(ym)}</div><div class="ch-w"><canvas id="cM"></canvas></div></div>
  <div class="tbk"><div class="tt">Acumulado mensual por grupo</div>
    <table><thead><tr><th>Grupo</th><th>Cantidad</th><th>Total $</th><th>%</th></tr></thead><tbody>${bgRows}</tbody></table>
  </div>
  <div style="margin-top:10px"><button class="btn btng" onclick="exportExcel()" style="width:100%">⬇ Exportar todo a Excel</button></div>`;
}

function rRepAnual(yr){
  const an=yrData(yr);
  const totV=an.reduce((s,x)=>s+x.tv,0),totG=an.reduce((s,x)=>s+x.tg,0),totCp=an.reduce((s,x)=>s+x.cp,0);
  const anRows=an.map(m=>`<tr><td>${m.lbl}</td><td style="font-family:var(--mo);color:var(--ac)">${$m(m.tv)}</td><td style="font-family:var(--mo);color:var(--rd)">${$m(m.tg+m.cp)}</td><td style="font-family:var(--mo);color:${m.res>=0?'var(--gn)':'var(--rd)'};font-weight:500">${$m(m.res)}</td></tr>`).join('');
  return`
  <div class="kpis t3">
    <div class="kc hi"><div class="kl">Ventas ${yr}</div><div class="kv a">${$m(totV)}</div></div>
    <div class="kc"><div class="kl">Costos ${yr}</div><div class="kv r">${$m(totG+totCp)}</div></div>
    <div class="kc"><div class="kl">Resultado</div><div class="kv ${totV-totG-totCp>=0?'g':'r'}">${$m(totV-totG-totCp)}</div></div>
  </div>
  <div class="blk"><div class="bt">Ventas vs Costos — ${yr}</div><div class="ch-w" style="height:160px"><canvas id="cA"></canvas></div></div>
  <div class="tbk"><div class="tt">Detalle mensual ${yr}</div>
    <table><thead><tr><th>Mes</th><th>Ventas</th><th>Costos</th><th>Resultado</th></tr></thead><tbody>${anRows}</tbody></table>
  </div>
  <div style="margin-top:10px"><button class="btn btng" onclick="exportExcel()" style="width:100%">⬇ Exportar todo a Excel</button></div>`;
}

function rRepFinanciero(tabs,ym){
  const{tv,tg,byG,cpProd,ingresos,egresos}=mData(ym);
  const costoTotal=tg+cpProd,ganancia=tv-costoTotal,margen=tv>0?Math.round((ganancia/tv)*100):0;
  const margenCol=margen>30?'var(--gn)':margen>10?'var(--ac)':'var(--rd)';
  const prMes=S.pr.filter(p=>(p.day||p.date||'').startsWith(ym));
  const catGas={};Object.entries(S.ga).filter(([d])=>d.startsWith(ym)).flatMap(([,g])=>g).forEach(g=>{catGas[g.cat]=(catGas[g.cat]||0)+g.amount});
  const catRows=Object.entries(catGas).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<tr><td>${c}</td><td style="font-family:var(--mo)">${$m(v)}</td><td style="font-family:var(--mo);color:var(--tx3)">${Math.round(tg>0?(v/tg)*100:0)}%</td></tr>`).join('')||`<tr><td colspan="3" class="empty-row">Sin gastos</td></tr>`;
  const prodCostRows=prMes.map(p=>`<tr><td>${fD(p.day||p.date||'')}</td><td>${esc(p.nombre)}</td><td style="font-family:var(--mo)">${$m(p.costo_total||0)}</td></tr>`).join('')||`<tr><td colspan="3" class="empty-row">Sin lotes</td></tr>`;
  return`
  <div class="mtabs">${tabs}</div>
  <div class="kpis t3">
    <div class="kc hi"><div class="kl">Ingresos</div><div class="kv a">${$m(tv)}</div></div>
    <div class="kc"><div class="kl">Costos totales</div><div class="kv r">${$m(costoTotal)}</div></div>
    <div class="kc"><div class="kl">Ganancia</div><div class="kv ${ganancia>=0?'g':'r'}">${$m(ganancia)}</div></div>
  </div>
  <div class="kpis t3">
    <div class="kc"><div class="kl">Margen neto</div><div class="kv" style="color:${margenCol}">${margen}%</div></div>
    <div class="kc"><div class="kl">Costo producción</div><div class="kv r" style="font-size:14px">${$m(cpProd)}</div></div>
    <div class="kc"><div class="kl">Gastos operativos</div><div class="kv r" style="font-size:14px">${$m(tg)}</div></div>
  </div>
  <div class="blk"><div class="bt">Estructura de costos</div>
    ${costoTotal>0?[['Producción',cpProd,'var(--bl)'],['Gastos op.',tg,'var(--or)']].map(([l,v,c])=>{const p=Math.round((v/costoTotal)*100);return`<div style="margin-bottom:7px"><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px"><span style="color:var(--tx2)">${l}</span><span style="font-family:var(--mo)">${$m(v)} (${p}%)</span></div><div class="sb-w"><div class="sb" style="width:${p}%;background:${c}"></div></div></div>`}).join(''):'<div style="font-size:11px;color:var(--tx3)">Sin datos</div>'}
  </div>
  <div class="tbk"><div class="tt">Costos de producción</div>
    <table><thead><tr><th>Fecha</th><th>Lote</th><th>Costo</th></tr></thead><tbody>${prodCostRows}</tbody></table>
  </div>
  <div class="tbk"><div class="tt">Gastos por categoría</div>
    <table><thead><tr><th>Categoría</th><th>Monto</th><th>%</th></tr></thead><tbody>${catRows}</tbody></table>
  </div>
  <div style="margin-top:10px"><button class="btn btng" onclick="exportExcel()" style="width:100%">⬇ Exportar todo a Excel</button></div>`;
}

function initCharts(){
  const ym=rMonth,yr=ym.split('-')[0];
  const[y2,mo]=ym.split('-').map(Number);const dc=new Date(y2,mo,0).getDate();
  const labs=[],dV=[],dC=[];
  for(let d=1;d<=dc;d++){const ds=ym+'-'+d.toString().padStart(2,'0');const v=(S.ve[ds]||[]).reduce((s,x)=>s+x.total,0);const g=(S.ga[ds]||[]).reduce((s,x)=>s+x.amount,0);const cp=S.pr.filter(p=>(p.day||p.date||'')===ds).reduce((s,p)=>s+p.costo_total,0);labs.push(d);dV.push(v);dC.push(g+cp);}
  const OPTS={responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#8a8680',font:{size:9,family:'DM Mono'}}}},scales:{x:{ticks:{color:'#4e4b48',font:{size:8}},grid:{color:'#252525'}},y:{ticks:{color:'#4e4b48',font:{size:9},callback:v=>'$'+Math.round(v).toLocaleString('es-AR')},grid:{color:'#252525'}}}};
  const cm=document.getElementById('cM');
  if(cm&&window.Chart){try{if(charts.cM)charts.cM.destroy()}catch(e){}charts.cM=new Chart(cm,{type:'bar',data:{labels:labs,datasets:[{label:'Ventas',data:dV,backgroundColor:'rgba(232,197,71,.7)',borderRadius:3},{label:'Costos',data:dC,backgroundColor:'rgba(248,113,113,.45)',borderRadius:3}]},options:OPTS});}
  const ca=document.getElementById('cA');
  if(ca&&window.Chart){try{if(charts.cA)charts.cA.destroy()}catch(e){}const an=yrData(yr);charts.cA=new Chart(ca,{type:'line',data:{labels:an.map(x=>x.lbl),datasets:[{label:'Ventas',data:an.map(x=>x.tv),borderColor:'rgba(232,197,71,.9)',backgroundColor:'rgba(232,197,71,.07)',tension:.3,fill:true,pointRadius:3,borderWidth:2},{label:'Costos',data:an.map(x=>x.tg+x.cp),borderColor:'rgba(248,113,113,.7)',backgroundColor:'transparent',tension:.3,pointRadius:3,borderWidth:1.5,borderDash:[4,3]}]},options:{...OPTS}});}
}

/* ══════════════════════════════════════════
   EXPORT EXCEL
══════════════════════════════════════════ */
function exportExcel(){
  if(!window.XLSX){alert('Cargando librería, intentá de nuevo en unos segundos');return;}
  const wb=XLSX.utils.book_new();
  // Hoja 1: Ventas
  const venArr=[['Fecha','Hora','Grupo','Variante','Cantidad','Stock usado','Precio unit.','Descuento %','Total','Método pago']];
  Object.entries(S.ve).sort(([a],[b])=>a.localeCompare(b)).forEach(([d,vs])=>vs.forEach(v=>{const vr=S.vr.find(x=>x.id===v.variant_id),gr=S.sg.find(x=>x.id===v.group_id);venArr.push([fDL(d),v.time||'',gr?gr.name:'',vr?vr.name:'',v.qty,v.stock_used||0,v.price_unit,v.descuento_pct||0,v.total,v.pago]);}));
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(venArr),'Ventas');
  // Hoja 2: Gastos
  const gasArr=[['Fecha','Hora','Descripción','Categoría','Monto']];
  Object.entries(S.ga).sort(([a],[b])=>a.localeCompare(b)).forEach(([d,gs])=>gs.forEach(g=>gasArr.push([fDL(d),g.time||'',g.descripcion,g.cat,g.amount])));
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(gasArr),'Gastos');
  // Hoja 3: Producción
  const prArr=[['Fecha','Hora','Lote','Output','Qty output','Costo total','Nota']];
  S.pr.forEach(p=>{const og=S.sg.find(x=>x.id===p.output_group_id);prArr.push([fDL(p.day||p.date||''),p.time||'',p.nombre,og?og.name:'',p.output_qty||0,p.costo_total||0,p.note||'']);});
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(prArr),'Producción');
  // Hoja 4: Compras
  const coArr=[['Fecha','Hora','Proveedor','Nro Factura','Total','Nota']];
  S.co.forEach(c=>coArr.push([fDL(c.day),c.time||'',c.proveedor,c.nro_factura||'',c.total,c.note||'']));
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(coArr),'Compras');
  // Hoja 5: Movimientos de caja
  const cajArr=[['Fecha','Hora','Tipo','Descripción','Método','Monto']];
  Object.entries(S.caja).sort(([a],[b])=>a.localeCompare(b)).forEach(([d,ms])=>ms.forEach(m=>cajArr.push([fDL(d),m.time||'',m.tipo,m.descripcion,m.metodo,m.monto])));
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(cajArr),'Caja');
  // Hoja 6: Resumen mensual
  const mths=getMths();
  const sumArr=[['Mes','Ventas','Gastos','Costo Prod.','Costos Totales','Ganancia','Margen %']];
  mths.forEach(ym=>{const{tv,tg,cpProd}=mData(ym);const ct=tg+cpProd,g=tv-ct,m=tv>0?Math.round((g/tv)*100):0;sumArr.push([fM(ym),tv,tg,cpProd,ct,g,m]);});
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(sumArr),'Resumen mensual');
  // Hoja 7: Stock actual
  const stArr=[['Nombre','Tipo','Unidad','Stock actual','Costo/unidad']];
  S.sg.forEach(g=>stArr.push([g.name,g.tipo||'venta',g.unit||'kg',g.stock_qty||0,g.cost_unit||0]));
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(stArr),'Stock');
  // download
  const fecha=arDay().replace(/-/g,'');
  XLSX.writeFile(wb,`LosPollosCunados_${fecha}.xlsx`);
  toast('Excel descargado ✓');
}

/* ══════════════════════════════════════════
   BOOT
══════════════════════════════════════════ */
// Auto-login si hay sesión guardada
if(sesion){
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app-screen').style.display='block';
  initApp();
} else {
  // preload usuarios para validar PIN
  fetch(SB+'/rest/v1/usuarios',{headers:SBH}).then(r=>r.json()).then(us=>{if(us&&us.length)S.usuarios=us;}).catch(()=>{});
}

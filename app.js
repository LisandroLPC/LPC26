/* ═══════════════════════════════════════════════════════
   LOS POLLOS CUÑADOS v5
═══════════════════════════════════════════════════════ */
const SB='https://pfxvkvvzxpwobtynupgk.supabase.co';
const SK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmeHZrdnZ6eHB3b2J0eW51cGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjM3NjIsImV4cCI6MjA5MDczOTc2Mn0.H2tqmv0T9npDmNW3Pid2qnUSze7EHvO1ky0-NQzmFIY';
const SBH={'apikey':SK,'Authorization':'Bearer '+SK,'Content-Type':'application/json','Prefer':'return=minimal'};

async function sbQ(t,q=''){const r=await fetch(SB+'/rest/v1/'+t+'?'+q,{headers:SBH});if(!r.ok)throw new Error(await r.text());return r.json();}
async function sbUp(t,d){const arr=Array.isArray(d)?d:[d];const r=await fetch(SB+'/rest/v1/'+t,{method:'POST',headers:{...SBH,'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(arr)});if(!r.ok)throw new Error(await r.text());}
async function sbDel(t,id){const r=await fetch(SB+'/rest/v1/'+t+'?id=eq.'+encodeURIComponent(id),{method:'DELETE',headers:SBH});if(!r.ok)throw new Error(await r.text());}

/* ── LOCAL CACHE ── */
const LC={g(k){try{return JSON.parse(localStorage.getItem('lpc5_'+k))||null}catch{return null}},s(k,v){localStorage.setItem('lpc5_'+k,JSON.stringify(v))}};

/* ── STATE ── */
let S={
  us:  LC.g('us')||[],
  sg:  LC.g('sg')||[],
  vr:  LC.g('vr')||[],
  ve:  LC.g('ve')||{},
  caja:LC.g('caja')||{},
  co:  LC.g('co')||[],
  coi: LC.g('coi')||[],
  ct:  LC.g('ct')||[],   // cortes
  cti: LC.g('cti')||[],  // cortes_items
  el:  LC.g('el')||[],   // elaboraciones
  eli: LC.g('eli')||[],  // elaboraciones_items
  ga:  LC.g('ga')||{},
  ins: LC.g('ins')||[],
};

let tab='caja', day=arDay(), online=navigator.onLine;
let sesion=LC.g('sesion')||null;
let corteItems=[], elabItems=[], compraItems=[];
let charts={}, rMonth=arMonth(), rTab='dia', prodTab='corte';
let loginRol='dueno', pinBuf='';

/* ── UTILS ── */
function arNow(){return new Date(new Date().toLocaleString('en-US',{timeZone:'America/Argentina/Buenos_Aires'}))}
function arDay(){const d=arNow();return d.getFullYear()+'-'+(d.getMonth()+1).toString().padStart(2,'0')+'-'+d.getDate().toString().padStart(2,'0')}
function arMonth(){const d=arNow();return d.getFullYear()+'-'+(d.getMonth()+1).toString().padStart(2,'0')}
function arTime(){return arNow().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}
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
function save(){LC.s('us',S.us);LC.s('sg',S.sg);LC.s('vr',S.vr);LC.s('ve',S.ve);LC.s('caja',S.caja);LC.s('co',S.co);LC.s('coi',S.coi);LC.s('ct',S.ct);LC.s('cti',S.cti);LC.s('el',S.el);LC.s('eli',S.eli);LC.s('ga',S.ga);LC.s('ins',S.ins);}
const UNITS=['kg','unidad','litro','docena','bandeja','bolsa','gramo','paquete'];

window.addEventListener('online',()=>{online=true;loadAll()});
window.addEventListener('offline',()=>{online=false;sync('err','offline')});

/* ══════════════════════════════════════════
   LOGIN
══════════════════════════════════════════ */
function selUser(r){loginRol=r;pinBuf='';document.getElementById('usel-dueno').classList.toggle('active',r==='dueno');document.getElementById('usel-empleado').classList.toggle('active',r==='empleado');updatePD();}
function pinPress(d){if(pinBuf.length>=6)return;pinBuf+=d;updatePD();}
function pinClear(){pinBuf='';updatePD();document.getElementById('pin-error').textContent='';}
function updatePD(){const el=document.getElementById('pin-display');if(el)el.textContent=pinBuf?'●'.repeat(pinBuf.length):'····';}
async function pinOk(){
  if(!pinBuf){document.getElementById('pin-error').textContent='Ingresá tu PIN';return;}
  let usr=S.us.find(u=>u.rol===loginRol&&u.pin===pinBuf&&u.activo!==false);
  if(!usr){if(loginRol==='dueno'&&pinBuf==='1234')usr={id:'usr_dueno',nombre:'Dueño',rol:'dueno'};else if(loginRol==='empleado'&&pinBuf==='0000')usr={id:'usr_empleado',nombre:'Empleado',rol:'empleado'};}
  if(!usr){document.getElementById('pin-error').textContent='PIN incorrecto';pinBuf='';updatePD();return;}
  sesion={id:usr.id,nombre:usr.nombre,rol:usr.rol};LC.s('sesion',sesion);
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app-screen').style.display='block';
  initApp();
}
function doLogout(){sesion=null;LC.s('sesion',null);pinBuf='';updatePD();document.getElementById('login-screen').style.display='flex';document.getElementById('app-screen').style.display='none';}

const NAV_D=[{id:'caja',i:'💰',l:'Caja'},{id:'stock',i:'📦',l:'Stock'},{id:'prod',i:'🔪',l:'Prod.'},{id:'compras',i:'🛒',l:'Compras'},{id:'reportes',i:'📊',l:'Reportes'}];
const NAV_E=[{id:'caja',i:'💰',l:'Caja'},{id:'gastos',i:'🧾',l:'Gastos'}];

function buildNav(){
  const items=sesion?.rol==='dueno'?NAV_D:NAV_E;
  document.getElementById('bottom-nav').innerHTML=items.map(n=>`<div class="bni ${n.id===tab?'active':''}" id="bn-${n.id}" onclick="go('${n.id}')"><div class="bi">${n.i}</div><div class="bl">${n.l}</div></div>`).join('');
}
function go(t){tab=t;document.querySelectorAll('.bni').forEach(el=>el.classList.toggle('active',el.id==='bn-'+t));render();}
function chDay(d){const dt=new Date(day+'T12:00:00');dt.setDate(dt.getDate()+d);const nd=dt.toISOString().split('T')[0];if(nd>arDay())return;day=nd;render();}

/* ══════════════════════════════════════════
   INIT & LOAD
══════════════════════════════════════════ */
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
    S.ins=ins.map(i=>({...i,costUnit:i.cost_unit||0}));
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

/* ══════════════════════════════════════════
   CAJA
══════════════════════════════════════════ */
function rCaja(){
  const vs=dV(),tv=vs.reduce((s,v)=>s+v.total,0);
  const ef=vs.filter(v=>v.pago==='Efectivo').reduce((s,v)=>s+v.total,0);
  const transf=tv-ef;
  const movs=dCaja();
  const ingEf=movs.filter(m=>m.tipo==='ingreso'&&m.metodo==='efectivo').reduce((s,m)=>s+m.monto,0);
  const ingTr=movs.filter(m=>m.tipo==='ingreso'&&m.metodo==='transferencia').reduce((s,m)=>s+m.monto,0);
  const egEf=movs.filter(m=>m.tipo==='egreso'&&m.metodo==='efectivo').reduce((s,m)=>s+m.monto,0);
  const egTr=movs.filter(m=>m.tipo==='egreso'&&m.metodo==='transferencia').reduce((s,m)=>s+m.monto,0);
  const ga=dG().reduce((s,g)=>s+g.amount,0);
  const cajaEf=ef+ingEf-egEf;
  const cajaTr=transf+ingTr-egTr;
  const resultado=tv+ingEf+ingTr-egEf-egTr-ga;

  const opts=S.vr.map(v=>{const g=sgV().find(x=>x.id===v.group_id);return`<option value="${v.id}" data-p="${v.price}" data-k="${v.qty_per_unit}">${esc(g?g.name+' › ':'')}${esc(v.name)}</option>`}).join('');

  const vRows=vs.length?vs.map(v=>{
    const vr=S.vr.find(x=>x.id===v.variant_id),gr=S.sg.find(x=>x.id===v.group_id);
    return`<tr>
      <td>${v.time||''}</td>
      <td style="max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(gr?gr.name:'–')}${vr?' › '+esc(vr.name):''}</td>
      <td>${v.qty}</td>
      <td>${$m(v.total)}${v.descuento_pct>0?` <span class="tag tc">-${v.descuento_pct}%</span>`:''}</td>
      <td><span class="tag tv">${(v.pago||'').slice(0,3)}</span></td>
      <td><button class="dbtn" onclick="delV('${v.id}')">✕</button></td>
    </tr>`;
  }).join(''):`<tr><td colspan="6" class="empty-row">Sin ventas</td></tr>`;

  const mRows=movs.length?movs.map(m=>`<tr>
    <td>${m.time||''}</td><td>${esc(m.descripcion)}</td>
    <td><span class="tag ${m.tipo==='ingreso'?'tv':'tg'}">${m.tipo}</span></td>
    <td style="color:${m.tipo==='ingreso'?'var(--gn)':'var(--rd)'}">${m.tipo==='ingreso'?'+':'-'}${$m(m.monto)}</td>
    <td><span class="tag tp">${m.metodo.slice(0,3)}</span></td>
    <td><button class="dbtn" onclick="delMov('${m.id}')">✕</button></td>
  </tr>`).join(''):`<tr><td colspan="6" class="empty-row">Sin movimientos</td></tr>`;

  return`
  <div class="kpis">
    <div class="kc hi"><div class="kl">Ventas totales</div><div class="kv a">${$m(tv)}</div><div class="kh">${vs.length} registros</div></div>
    <div class="kc"><div class="kl">Resultado día</div><div class="kv ${resultado>=0?'g':'r'}">${$m(resultado)}</div></div>
    <div class="kc"><div class="kl">Efectivo caja</div><div class="kv">${$m(cajaEf)}</div><div class="kh">ventas+mov</div></div>
    <div class="kc"><div class="kl">Transferencias</div><div class="kv">${$m(cajaTr)}</div><div class="kh">ventas+mov</div></div>
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
  <div class="blk"><div class="bt">Movimiento de caja</div>
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
  const k=parseFloat(o?.dataset?.k)||1,q=parseFloat(document.getElementById('v-qty')?.value)||0,p=parseFloat(document.getElementById('v-price')?.value)||0,d=parseFloat(document.getElementById('v-desc')?.value)||0;
  const total=q*p*(1-d/100);
  const vr=S.vr.find(x=>x.id===s?.value),gr=vr?S.sg.find(x=>x.id===vr.group_id):null;
  const td2=document.getElementById('v-tot'),kd=document.getElementById('v-kgd');
  if(td2)td2.value=total?$m(total):'';
  if(kd)kd.value=q*k?'−'+fQ(q*k,gr?.unit||'kg'):'';
}
async function addV(){
  const s=document.getElementById('v-var'),o=s?.options[s.selectedIndex];
  const varId=s?.value,kpu=parseFloat(o?.dataset?.k)||1,qty=parseFloat(document.getElementById('v-qty').value)||0,price=parseFloat(document.getElementById('v-price').value)||0,pago=document.getElementById('v-pago').value,desc=parseFloat(document.getElementById('v-desc')?.value)||0;
  if(!varId||!qty||!price)return alert('Completá todos los campos');
  const vr=S.vr.find(x=>x.id===varId);if(!vr)return;
  const gr=S.sg.find(x=>x.id===vr.group_id);if(!gr)return;
  const stockUsed=qty*kpu,total=qty*price*(1-desc/100);
  if((gr.stock_qty||0)<stockUsed&&!confirm(`Stock bajo en ${gr.name}: quedan ${fQ(gr.stock_qty,gr.unit)}. ¿Continuar?`))return;
  const row={id:uid(),day,variant_id:varId,group_id:vr.group_id,qty,stock_used:stockUsed,price_unit:price,descuento_pct:desc,total,pago,time:arTime()};
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
function rStock(){
  const low=sgV().filter(g=>(g.stock_qty||0)<2);
  const alrt=low.length?`<div class="alrt">⚠ Stock bajo: ${low.map(g=>esc(g.name)+' ('+fQ(g.stock_qty,g.unit)+')').join(', ')}</div>`:'';
  const uOpts=UNITS.map(u=>`<option>${u}</option>`).join('');

  const sgRows=tipo=>S.sg.filter(g=>(g.tipo||'venta')===tipo).map(g=>{
    const max=Math.max(...S.sg.filter(x=>(x.tipo||'venta')===tipo).map(x=>x.stock_qty||0),1),pct=Math.min(100,Math.round(((g.stock_qty||0)/max)*100));
    const col=(g.stock_qty||0)<2?'var(--rd)':(g.stock_qty||0)<5?'var(--or)':'var(--gn)';
    return`<tr>
      <td><div style="font-size:12px">${esc(g.name)} <span style="font-size:9px;color:var(--tx3)">${g.unit||'kg'}</span></div>
        ${tipo==='venta'?`<div style="font-size:9px;color:var(--tx3)">${S.vr.filter(v=>v.group_id===g.id).map(v=>esc(v.name)).join(', ')||'sin variantes'}</div>`:''}
        <div class="sb-w"><div class="sb" style="width:${pct}%;background:${col}"></div></div>
      </td>
      <td style="color:${col};font-family:var(--mo);font-weight:500">${fQ(g.stock_qty,g.unit)}</td>
      <td><input type="number" class="ip" value="${+(g.stock_qty||0).toFixed(3)}" step="0.1" min="0" onchange="updGS('${g.id}',this.value)"></td>
      ${tipo==='produccion'?`<td><input type="number" class="ip" value="${+(g.cost_unit||0).toFixed(2)}" step="0.01" min="0" onchange="updGCost('${g.id}',this.value)" title="Costo/${g.unit||'kg'}"></td>`:'<td></td>'}
      <td><button class="dbtn" onclick="delG('${g.id}')">✕</button></td>
    </tr>`;
  }).join('')||`<tr><td colspan="5" class="empty-row">Sin grupos</td></tr>`;

  const vrRows=sgV().map(g=>{
    const vars=S.vr.filter(v=>v.group_id===g.id);if(!vars.length)return'';
    return`<tr style="background:rgba(255,255,255,.01)"><td colspan="4" style="padding:5px 12px;font-size:9px;color:var(--tx3);text-transform:uppercase;letter-spacing:.5px;border-top:1px solid var(--br)">${esc(g.name)} (${g.unit||'kg'})</td></tr>`
      +vars.map(v=>`<tr><td style="padding-left:18px">${esc(v.name)}</td><td style="color:var(--tx3);font-size:10px">−${v.qty_per_unit} ${g.unit||'kg'}/u</td><td><input type="number" class="ip" value="${v.price||0}" onchange="updVP('${v.id}',this.value)"></td><td><button class="dbtn" onclick="delVr('${v.id}')">✕</button></td></tr>`).join('');
  }).join('');
  const grOptV=sgV().map(g=>`<option value="${g.id}">${esc(g.name)} (${g.unit||'kg'})</option>`).join('');

  return`${alrt}
  <div class="sh">Stock de venta</div>
  <div class="blk"><div class="bt">Nuevo grupo de venta</div>
    <div class="fr">
      <div class="fl" style="flex:2"><label>Nombre</label><input type="text" id="sg-n" placeholder="Ej: Cuartos, Supremas, Milanesas..."></div>
      <div class="fl" style="max-width:90px"><label>Unidad</label><select id="sg-u">${uOpts}</select></div>
      <div class="fl" style="max-width:70px"><label>Stock inicial</label><input type="number" id="sg-s" placeholder="0" step="0.1"></div>
    </div>
    <button class="btn btnp" onclick="addG('venta')" style="width:100%;margin-top:4px">+ Crear</button>
  </div>
  <div class="tbk"><div class="tt">Stock de venta — ajustá directo</div>
    <table><thead><tr><th>Grupo</th><th>Stock</th><th>Ajustar</th><th></th><th></th></tr></thead>
    <tbody>${sgRows('venta')}</tbody></table>
  </div>
  <div class="sh">Variantes de venta</div>
    <div class="fr">
      <div class="fl"><label>Grupo</label><select id="vr-g">${grOptV||'<option>Sin grupos</option>'}</select></div>
      <div class="fl" style="flex:2"><label>Nombre</label><input type="text" id="vr-n" placeholder="Ej: Cuarto x kg, Oferta 3kg, Pata..."></div>
    </div>
    <div class="fr">
      <div class="fl"><label>Cantidad que descuenta</label><input type="number" id="vr-k" placeholder="Ej: 1, 3, 0.35" min="0.001" step="0.001"></div>
      <div class="fl"><label>Precio $</label><input type="number" id="vr-p" placeholder="0"></div>
      <button class="btn btnp" onclick="addVr()" style="align-self:flex-end">+ Crear</button>
    </div>
  </div>
  <div class="tbk"><div class="tt">Variantes — editá precio directo</div>
    <table><thead><tr><th>Variante</th><th>Descuenta</th><th>Precio $</th><th></th></tr></thead>
    <tbody>${vrRows||`<tr><td colspan="4" class="empty-row">Sin variantes</td></tr>`}</tbody>
  </div>
  `;
}

async function addG(tipo){
  const n=document.getElementById(tipo==='produccion'?'sgp-n':'sg-n')?.value.trim();
  const u=document.getElementById(tipo==='produccion'?'sgp-u':'sg-u')?.value||'kg';
  const s=parseFloat(document.getElementById(tipo==='produccion'?'sgp-s':'sg-s')?.value)||0;
  const c=parseFloat(document.getElementById('sgp-c')?.value)||0;
  if(!n)return alert('Ingresá un nombre');
  if(S.sg.find(g=>g.name===n&&(g.tipo||'venta')===tipo))return alert('Ya existe');
  const row={id:uid(),name:n,unit:u,stock_qty:s,tipo,cost_unit:tipo==='produccion'?c:0};
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
  return`
  <div class="prod-tabs">
    <button class="prod-tab ${prodTab==='corte'?'active':''}" onclick="setProdTab('corte')">✂ Corte — Ingreso de stock</button>
    <button class="prod-tab ${prodTab==='elab'?'active':''}" onclick="setProdTab('elab')">🍳 Elaboración</button>
  </div>
  ${prodTab==='corte'?rCorte():rElab()}`;
}
function setProdTab(t){prodTab=t;render();}

/* ── CORTE (ingresa stock, sin costo) ── */
function rCorte(){
  const todC=S.ct.filter(c=>c.day===day);
  const sgVOpts=sgV().map(g=>`<option value="${g.id}" data-u="${g.unit||'kg'}">${esc(g.name)} (${g.unit||'kg'})</option>`).join('');

  const corteCards=todC.length?todC.map(c=>{
    const items=S.cti.filter(i=>i.corte_id===c.id);
    return`<div class="lote-card">
      <div class="lote-card-header">
        <div><div style="font-size:13px;font-weight:600">${esc(c.nombre)}</div>
          <div style="font-size:10px;color:var(--tx3);font-family:var(--mo)">${c.time||''}</div>
        </div>
        <button class="dbtn" onclick="delCorte('${c.id}')">✕</button>
      </div>
      ${items.length?`<div class="lote-card-items">${items.map(i=>{const g=S.sg.find(x=>x.id===i.group_id);return`<div style="font-size:10px;color:var(--tx2);padding:2px 0">+ ${fQ(i.qty,i.unit||g?.unit)} → ${esc(i.nombre)}</div>`}).join('')}</div>`:''}
      ${c.note?`<div style="font-size:10px;color:var(--tx3);margin-top:3px">${esc(c.note)}</div>`:''}
    </div>`;
  }).join(''):`<div class="empty-row">Sin cortes registrados hoy</div>`;

  return`
  <div class="info-box green">✂ Registrá los kg de cada corte obtenido. Esto ingresa directamente al stock de venta sin agregar costos.</div>
  <div class="blk"><div class="bt">Nuevo corte / ingreso de stock</div>
    <div class="fr">
      <div class="fl" style="flex:2"><label>Nombre del corte</label><input type="text" id="ct-n" placeholder="Ej: Corte mañana, Tanda 1..."></div>
      <div class="fl"><label>Nota</label><input type="text" id="ct-note" placeholder="opcional"></div>
    </div>
  </div>
  <div class="blk"><div class="bt">Cortes obtenidos</div>
    <div id="corte-items-list"></div>
    <div class="fr" style="margin-top:8px">
      <div class="fl" style="flex:2"><label>Grupo de stock</label><select id="ci-grp">${sgVOpts||'<option>Sin grupos de venta</option>'}</select></div>
      <div class="fl" style="max-width:70px"><label>Cantidad</label><input type="number" id="ci-qty" placeholder="0" min="0.01" step="0.01"></div>
      <button class="btn" onclick="addCorteItem()" style="align-self:flex-end;padding:6px 10px;font-size:11px">+</button>
    </div>
    <button class="btn btnp" onclick="saveCorte()" style="width:100%;margin-top:8px">✓ Guardar corte</button>
  </div>
  <div class="sh">Cortes de hoy</div>
  ${corteCards}`;
}

function renderCorteItems(){
  const list=document.getElementById('corte-items-list');if(!list)return;
  if(!corteItems.length){list.innerHTML=`<div style="font-size:11px;color:var(--tx3);font-family:var(--mo);padding:4px 0">Sin cortes agregados</div>`;return;}
  list.innerHTML=corteItems.map((x,i)=>`<div class="pvi"><div><div class="pvn">${esc(x.nombre)} <span class="tag tv">+${fQ(x.qty,x.unit)}</span></div></div><button class="dbtn" onclick="rmCorteItem(${i})">✕</button></div>`).join('');
}
function addCorteItem(){
  const sel=document.getElementById('ci-grp'),opt=sel?.options[sel.selectedIndex],gid=sel?.value,qty=parseFloat(document.getElementById('ci-qty')?.value)||0;
  if(!gid||!qty)return alert('Seleccioná grupo y cantidad');
  const g=S.sg.find(x=>x.id===gid);
  corteItems.push({group_id:gid,nombre:g?g.name:gid,qty,unit:opt?.dataset?.u||g?.unit||'kg'});
  document.getElementById('ci-qty').value='';renderCorteItems();
}
function rmCorteItem(i){corteItems.splice(i,1);renderCorteItems();}
async function saveCorte(){
  const nom=document.getElementById('ct-n')?.value.trim(),note=document.getElementById('ct-note')?.value.trim();
  if(!nom)return alert('Ingresá un nombre');if(!corteItems.length)return alert('Agregá al menos un corte');
  const corteId=uid();
  const corte={id:corteId,day,nombre:nom,note:note||null,time:arTime()};
  const items=corteItems.map(x=>({id:uid(),corte_id:corteId,group_id:x.group_id,nombre:x.nombre,qty:x.qty,unit:x.unit}));
  // ingresar al stock
  items.forEach(x=>{const g=S.sg.find(sg=>sg.id===x.group_id);if(g)g.stock_qty=(g.stock_qty||0)+x.qty;});
  S.ct.push(corte);S.cti.push(...items);corteItems=[];save();render();
  if(online){sync('busy','guardando...');try{
    await sbUp('cortes',corte);if(items.length)await sbUp('cortes_items',items);
    const changed=[...new Set(items.map(x=>x.group_id))];
    for(const gid of changed){const g=S.sg.find(x=>x.id===gid);if(g)await sbUp('stock_groups',{id:g.id,name:g.name,unit:g.unit,tipo:g.tipo,stock_qty:g.stock_qty,cost_unit:g.cost_unit||0});}
    sync('ok','guardado');
  }catch(e){sync('err','error');console.error(e)}}
}
async function delCorte(id){
  if(!confirm('¿Eliminar este corte? Se revertirá el stock.'))return;
  const items=S.cti.filter(x=>x.corte_id===id);
  items.forEach(x=>{const g=S.sg.find(sg=>sg.id===x.group_id);if(g)g.stock_qty=Math.max(0,(g.stock_qty||0)-x.qty);});
  S.ct=S.ct.filter(x=>x.id!==id);S.cti=S.cti.filter(x=>x.corte_id!==id);save();render();
  if(online){try{
    await sbDel('cortes',id);
    const changed=[...new Set(items.map(x=>x.group_id))];
    for(const gid of changed){const g=S.sg.find(x=>x.id===gid);if(g)await sbUp('stock_groups',{id:g.id,name:g.name,unit:g.unit,tipo:g.tipo,stock_qty:g.stock_qty,cost_unit:g.cost_unit||0});}
  }catch(e){}}
}

/* ── ELABORACIÓN (consume stock, costo solo informativo) ── */
function rElab(){
  const todE=S.el.filter(e=>e.day===day);
  const sgVOpts=sgV().map(g=>`<option value="${g.id}">${esc(g.name)} (${g.unit||'kg'})</option>`).join('');
  const insOpts=S.ins.map(i=>`<option value="${i.id}" data-cu="${i.costUnit||0}" data-u="${i.unit}">${esc(i.name)} (${$d2(i.costUnit||0)}/${i.unit})</option>`).join('');
  const allStockOpts=sgV().map(g=>`<option value="sg_${g.id}" data-cu="${g.cost_unit||0}" data-u="${g.unit||'kg'}">${esc(g.name)} (costo: ${$d2(g.cost_unit||0)}/${g.unit||'kg'})</option>`).join('');

  const elabCards=todE.length?todE.map(e=>{
    const outG=S.sg.find(x=>x.id===e.output_group_id);
    const items=S.eli.filter(i=>i.elaboracion_id===e.id);
    return`<div class="lote-card">
      <div class="lote-card-header">
        <div><div style="font-size:13px;font-weight:600">${esc(e.nombre)}</div>
          <div style="font-size:10px;color:var(--tx3);font-family:var(--mo)">${e.time||''}${outG?' → '+outG.name+' +'+fQ(e.output_qty,outG.unit):''}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;font-family:var(--mo);color:var(--tx2)">Costo ref.: ${$m(e.costo_total_info||0)}</div>
          <button class="dbtn" onclick="delElab('${e.id}')" style="margin-top:3px">✕</button>
        </div>
      </div>
      ${items.length?`<div class="lote-card-items">${items.map(i=>`<div style="font-size:10px;color:var(--tx2);padding:2px 0">−${fQ(i.qty,i.unit)} ${esc(i.nombre)} — ref. ${$m(i.costo_subtotal||0)}</div>`).join('')}</div>`:''}
      ${e.note?`<div style="font-size:10px;color:var(--tx3);margin-top:3px">${esc(e.note)}</div>`:''}
    </div>`;
  }).join(''):`<div class="empty-row">Sin elaboraciones registradas hoy</div>`;

  return`
  <div class="info-box amber">🍳 Los costos aquí son <strong>solo informativos</strong>. No generan gastos nuevos — ya están cubiertos por las facturas de compra.</div>
  <div class="blk"><div class="bt">Nuevo lote de elaboración</div>
    <div class="fr">
      <div class="fl" style="flex:2"><label>Nombre del lote</label><input type="text" id="el-n" placeholder="Ej: Milanesas tarde, Croquetas..."></div>
      <div class="fl"><label>Nota</label><input type="text" id="el-note" placeholder=""></div>
    </div>
    <div class="fr">
      <div class="fl" style="flex:2"><label>Resultado → ingresa a stock de venta</label><select id="el-outg"><option value="">No ingresa a stock</option>${sgVOpts}</select></div>
      <div class="fl" style="max-width:80px"><label>Cantidad</label><input type="number" id="el-outqty" placeholder="0" step="0.01"></div>
    </div>
  </div>
  <div class="blk"><div class="bt">Ingredientes del lote (descuenta stock)</div>
    <div id="elab-items-list"></div>
    <div class="fr" style="margin-top:8px">
      <div class="fl" style="max-width:100px"><label>Tipo</label>
        <select id="eli-tipo" onchange="onElabTipo()">
          <option value="stock">Stock de venta</option>
          <option value="insumo">Insumo</option>
        </select>
      </div>
      <div class="fl" style="flex:2"><label>Item</label><select id="eli-item">${allStockOpts||'<option>Sin grupos</option>'}</select></div>
      <div class="fl" style="max-width:65px"><label>Cantidad</label><input type="number" id="eli-qty" placeholder="0" min="0.001" step="0.001"></div>
      <button class="btn" onclick="addElabItem()" style="align-self:flex-end;padding:6px 10px;font-size:11px">+</button>
    </div>
    <button class="btn btnp" onclick="saveElab()" style="width:100%;margin-top:8px">✓ Guardar elaboración</button>
  </div>
  <div class="sh">Elaboraciones de hoy</div>
  ${elabCards}
  <div class="sh">Insumos</div>
  ${rInsumosBlk()}`;
}

function onElabTipo(){
  const t=document.getElementById('eli-tipo')?.value,s=document.getElementById('eli-item');if(!s)return;
  if(t==='stock')s.innerHTML=sgV().map(g=>`<option value="sg_${g.id}" data-cu="${g.cost_unit||0}" data-u="${g.unit||'kg'}">${esc(g.name)} (costo: ${$d2(g.cost_unit||0)}/${g.unit||'kg'})</option>`).join('')||'<option>Sin grupos</option>';
  else s.innerHTML=S.ins.map(i=>`<option value="ins_${i.id}" data-cu="${i.costUnit||0}" data-u="${i.unit}">${esc(i.name)} (${$d2(i.costUnit||0)}/${i.unit})</option>`).join('')||'<option>Sin insumos</option>';
}

function renderElabItems(){
  const list=document.getElementById('elab-items-list');if(!list)return;
  if(!elabItems.length){list.innerHTML=`<div style="font-size:11px;color:var(--tx3);font-family:var(--mo);padding:4px 0">Sin ingredientes agregados</div>`;return;}
  const cT=elabItems.reduce((s,x)=>s+x.costo_subtotal,0);
  list.innerHTML=elabItems.map((x,i)=>`<div class="pvi"><div><div class="pvn">${esc(x.nombre)} <span class="tag ${x.tipo==='stock'?'tp':'tc'}">${x.tipo==='stock'?'stock':'insumo'}</span></div><div class="pvd">−${fQ(x.qty,x.unit)} × ${$d2(x.costo_unit)} = ${$m(x.costo_subtotal)} <span style="color:var(--tx3)">(ref.)</span></div></div><button class="dbtn" onclick="rmElabItem(${i})">✕</button></div>`).join('')
    +`<div style="text-align:right;font-size:12px;font-family:var(--mo);color:var(--tx2);padding:6px 0;border-top:1px solid var(--br);margin-top:4px">Costo referencial total: ${$m(cT)}</div>`;
}
function addElabItem(){
  const tipo=document.getElementById('eli-tipo')?.value;
  const sel=document.getElementById('eli-item'),opt=sel?.options[sel.selectedIndex],val=sel?.value;
  const qty=parseFloat(document.getElementById('eli-qty')?.value)||0;
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
  const elabId=uid();
  const elab={id:elabId,day,nombre:nom,output_group_id:outGid||null,output_qty:outQty,costo_total_info:costoInfo,note:note||null,time:arTime()};
  const items=elabItems.map(x=>({id:uid(),elaboracion_id:elabId,tipo:x.tipo,ref_id:x.ref_id,nombre:x.nombre,qty:x.qty,unit:x.unit,costo_unit:x.costo_unit,costo_subtotal:x.costo_subtotal}));
  // descontar stock (solo stock de venta, no insumos)
  items.forEach(x=>{if(x.tipo==='stock'){const g=S.sg.find(sg=>sg.id===x.ref_id);if(g)g.stock_qty=Math.max(0,(g.stock_qty||0)-x.qty);}});
  // agregar resultado al stock de venta
  if(outGid&&outQty>0){const og=S.sg.find(x=>x.id===outGid);if(og)og.stock_qty=(og.stock_qty||0)+outQty;}
  S.el.push(elab);S.eli.push(...items);elabItems=[];save();render();
  if(online){sync('busy','guardando...');try{
    await sbUp('elaboraciones',{id:elab.id,day:elab.day,nombre:elab.nombre,output_group_id:elab.output_group_id,output_qty:elab.output_qty,costo_total_info:elab.costo_total_info,note:elab.note,time:elab.time});
    if(items.length)await sbUp('elaboraciones_items',items);
    const changed=[...new Set([...(outGid?[outGid]:[]),...items.filter(x=>x.tipo==='stock').map(x=>x.ref_id)])];
    for(const gid of changed){const g=S.sg.find(x=>x.id===gid);if(g)await sbUp('stock_groups',{id:g.id,name:g.name,unit:g.unit,tipo:g.tipo,stock_qty:g.stock_qty,cost_unit:g.cost_unit||0});}
    sync('ok','guardado');
  }catch(e){sync('err','error');console.error(e)}}
}
async function delElab(id){
  if(!confirm('¿Eliminar esta elaboración? Se revertirá el stock.'))return;
  const elab=S.el.find(x=>x.id===id);
  if(elab){
    const items=S.eli.filter(x=>x.elaboracion_id===id);
    items.forEach(x=>{if(x.tipo==='stock'){const g=S.sg.find(sg=>sg.id===x.ref_id);if(g)g.stock_qty=(g.stock_qty||0)+x.qty;}});
    if(elab.output_group_id&&elab.output_qty){const og=S.sg.find(x=>x.id===elab.output_group_id);if(og)og.stock_qty=Math.max(0,(og.stock_qty||0)-elab.output_qty);}
  }
  S.el=S.el.filter(x=>x.id!==id);S.eli=S.eli.filter(x=>x.elaboracion_id!==id);save();render();
  if(online){try{
    await sbDel('elaboraciones',id);
    const items=S.eli.filter(x=>x.elaboracion_id===id);
    const changed=[...new Set([...(elab?.output_group_id?[elab.output_group_id]:[]),...items.filter(x=>x.tipo==='stock').map(x=>x.ref_id)])];
    for(const gid of changed){const g=S.sg.find(x=>x.id===gid);if(g)await sbUp('stock_groups',{id:g.id,name:g.name,unit:g.unit,tipo:g.tipo,stock_qty:g.stock_qty,cost_unit:g.cost_unit||0});}
  }catch(e){}}
}

function rInsumosBlk(){
  const rows=S.ins.length?S.ins.map(i=>`<tr><td>${esc(i.name)}</td><td><input type="number" class="ip" value="${i.costUnit||0}" onchange="updIns('${i.id}',this.value)"></td><td style="color:var(--tx3)">${i.unit}</td><td><button class="dbtn" onclick="delIns('${i.id}')">✕</button></td></tr>`).join(''):`<tr><td colspan="4" class="empty-row">Sin insumos</td></tr>`;
  return`<div class="blk"><div class="bt">Agregar insumo</div>
    <div class="fr"><div class="fl" style="flex:2"><label>Nombre</label><input type="text" id="ins-n" placeholder="Ej: Harina, Aceite, Huevo..."></div><div class="fl" style="max-width:75px"><label>Unidad</label><select id="ins-u"><option>kg</option><option>litro</option><option>unidad</option><option>bolsa</option></select></div></div>
    <div class="fr"><div class="fl"><label>Costo/unidad $</label><input type="number" id="ins-c" placeholder="0"></div><button class="btn btnp" onclick="addIns()" style="align-self:flex-end">+ Agregar</button></div>
  </div>
  <div class="tbk"><div class="tt">Insumos — editá costo directo</div>
    <table><thead><tr><th>Insumo</th><th>Costo $</th><th>Unidad</th><th></th></tr></thead><tbody>${rows}</tbody></table>
  </div>`;
}
async function addIns(){const n=document.getElementById('ins-n')?.value.trim(),u=document.getElementById('ins-u')?.value,c=parseFloat(document.getElementById('ins-c')?.value)||0;if(!n||!c)return alert('Completá nombre y costo');if(S.ins.find(i=>i.name===n))return alert('Ya existe');const row={id:uid(),name:n,unit:u,costUnit:c,cost_unit:c};S.ins.push(row);save();render();if(online){try{await sbUp('insumos',{id:row.id,name:row.name,unit:row.unit,cost_unit:row.costUnit});sync('ok','guardado')}catch(e){sync('err','error')}}}
async function updIns(id,v){const i=S.ins.find(x=>x.id===id);if(!i)return;i.costUnit=parseFloat(v)||0;i.cost_unit=i.costUnit;save();toast('Costo actualizado ✓');if(online){try{await sbUp('insumos',{id:i.id,name:i.name,unit:i.unit,cost_unit:i.costUnit});sync('ok','guardado')}catch(e){sync('err','error')}}}
async function delIns(id){S.ins=S.ins.filter(x=>x.id!==id);save();render();if(online){try{await sbDel('insumos',id)}catch(e){}}}

/* ══════════════════════════════════════════
   COMPRAS
══════════════════════════════════════════ */
function rCompras(){
  const todC=S.co.filter(c=>c.day===day);

  // Selector: grupos de venta + insumos (sin stock de producción que ya no se usa)
  const sgVOpts=sgV().map(g=>`<option value="sgv_${g.id}" data-u="${g.unit||'kg'}">${esc(g.name)} (${g.unit||'kg'})</option>`).join('');
  const insOpts=S.ins.map(i=>`<option value="ins_${i.id}" data-u="${i.unit}">${esc(i.name)} (${i.unit})</option>`).join('');
  const allOpts=`<optgroup label="Stock de venta (actualiza costo/kg)">${sgVOpts||'<option disabled>Sin grupos — creá en Stock</option>'}</optgroup><optgroup label="Insumos">${insOpts||'<option disabled>Sin insumos — creá en Producción</option>'}</optgroup>`;

  // Checkboxes para propagar costo/kg a grupos de venta
  const propagaOpts=sgV().map(g=>`
    <label style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:11px;cursor:pointer">
      <input type="checkbox" id="prop_${g.id}" value="${g.id}" style="width:auto;accent-color:var(--ac)">
      ${esc(g.name)} (${g.unit||'kg'})
    </label>`).join('');

  const comprasCards=todC.length?todC.map(c=>{
    const items=S.coi.filter(i=>i.compra_id===c.id);
    const pagoInfo=[];
    if(c.pago_efectivo>0)pagoInfo.push(`Ef: ${$m(c.pago_efectivo)}`);
    if(c.pago_transferencia>0)pagoInfo.push(`Tr: ${$m(c.pago_transferencia)}`);
    // parse propagated groups from note field
    const propGroups=c.grupos_propagados?JSON.parse(c.grupos_propagados):[];
    const propNames=propGroups.map(id=>{const g=S.sg.find(x=>x.id===id);return g?g.name:''}).filter(Boolean);
    return`<div class="lote-card">
      <div class="lote-card-header">
        <div><div style="font-size:13px;font-weight:600">${esc(c.proveedor)}</div>
          <div style="font-size:10px;color:var(--tx3);font-family:var(--mo)">${c.time||''}${c.nro_factura?' · F/'+esc(c.nro_factura):''}</div>
          ${pagoInfo.length?`<div style="font-size:10px;color:var(--tx2);font-family:var(--mo)">${pagoInfo.join(' + ')}</div>`:''}
          ${propNames.length?`<div style="font-size:10px;color:var(--ac);font-family:var(--mo)">Costo propagado a: ${propNames.join(', ')}</div>`:''}
        </div>
        <div style="text-align:right">
          <div style="font-size:13px;font-family:var(--mo);color:var(--ac)">${$m(c.total)}</div>
          <button class="dbtn" onclick="delCompra('${c.id}')" style="margin-top:3px">✕</button>
        </div>
      </div>
      ${items.length?`<div class="lote-card-items">${items.map(i=>`<div style="font-size:10px;color:var(--tx2);padding:2px 0">${esc(i.descripcion)}: ${i.qty_compra} ${i.unit_compra||''} ${i.qty_real?'→ '+fQ(i.qty_real,i.unit_real):''} — ${$m(i.precio_total)}${i.cost_unit_calculado?' (costo: '+$d2(i.cost_unit_calculado)+'/'+i.unit_real+')':''}</div>`).join('')}</div>`:''}
      ${c.note?`<div style="font-size:10px;color:var(--tx3);margin-top:3px">${esc(c.note)}</div>`:''}
    </div>`;
  }).join(''):`<div class="empty-row">Sin compras hoy</div>`;

  return`
  <div class="info-box">🛒 Al guardar: calcula el costo/kg, lo propaga a los grupos de stock que elijas, y registra el total como gasto del día.</div>
  <div class="sh">Nueva factura de proveedor</div>
  <div class="blk"><div class="bt">Datos de la factura</div>
    <div class="fr">
      <div class="fl" style="flex:2"><label>Proveedor</label><input type="text" id="cp-prov" placeholder="Ej: Avícola Don Juan"></div>
      <div class="fl" style="max-width:110px"><label>Nro. Factura</label><input type="text" id="cp-fact" placeholder="opcional"></div>
    </div>
    <div class="fr">
      <div class="fl"><label>Nota</label><input type="text" id="cp-note" placeholder=""></div>
    </div>
    <div style="font-size:9px;color:var(--tx2);font-family:var(--mo);margin-bottom:6px;margin-top:6px">FORMA DE PAGO</div>
    <div class="fr">
      <div class="fl"><label>Efectivo $</label><input type="number" id="cp-ef" placeholder="0" oninput="calcCpTotal()"></div>
      <div class="fl"><label>Transferencia $</label><input type="number" id="cp-tr" placeholder="0" oninput="calcCpTotal()"></div>
      <div class="fl"><label>Total factura</label><input type="text" id="cp-tot" readonly style="color:var(--ac)"></div>
    </div>
  </div>

  <div class="blk"><div class="bt">Artículos de la factura</div>
    <div id="cp-items-list"></div>
    <div class="sep"></div>
    <div style="font-size:9px;color:var(--tx2);font-family:var(--mo);margin-bottom:7px">AGREGAR ARTÍCULO</div>
    <div class="fr">
      <div class="fl" style="flex:2"><label>Descripción</label><input type="text" id="ci-desc" placeholder="Ej: Cajón pollo, Pan rallado..."></div>
      <div class="fl"><label>Actualiza</label><select id="ci-ref">${allOpts}</select></div>
    </div>
    <div class="fr">
      <div class="fl" style="max-width:70px"><label>Cant. compra</label><input type="number" id="ci-qtyc" placeholder="4" min="0.001" step="0.001"></div>
      <div class="fl" style="max-width:90px"><label>Unidad compra</label><input type="text" id="ci-uc" placeholder="cajón, bolsa..."></div>
      <div class="fl" style="max-width:70px"><label>Cant. real (kg)</label><input type="number" id="ci-qtyr" placeholder="74" min="0.001" step="0.001"></div>
      <div class="fl" style="max-width:80px"><label>Precio total $</label><input type="number" id="ci-precio" placeholder="0" oninput="calcCostoUnitario()"></div>
      <button class="btn" onclick="addCompraItem()" style="align-self:flex-end;padding:6px 10px;font-size:11px">+</button>
    </div>
    <div style="font-size:9px;color:var(--tx3);font-family:var(--mo);margin-top:2px" id="costo-preview"></div>
    <div style="font-size:9px;color:var(--tx3);font-family:var(--mo)">Cant. real = kg reales de la pesada. Ej: 4 cajones → 74kg → costo/kg = total ÷ 74</div>
  </div>

  ${sgV().length?`<div class="blk"><div class="bt">Propagar costo/kg a grupos de stock (informativo)</div>
    <div style="font-size:10px;color:var(--tx2);font-family:var(--mo);margin-bottom:8px">Marcá los grupos cuyo costo/kg querés actualizar con el de esta compra. No afecta gastos.</div>
    <div id="prop-grupos">${propagaOpts||'<div style="font-size:11px;color:var(--tx3)">Sin grupos de venta</div>'}</div>
    <button class="btn" onclick="selAllProp()" style="font-size:11px;padding:4px 10px;margin-top:8px">Seleccionar todos</button>
  </div>`:''}

  <button class="btn btnp" onclick="saveCompra()" style="width:100%;margin-top:4px">✓ Guardar factura</button>

  <div class="sh">Compras de hoy</div>
  ${comprasCards}`;
}

function calcCpTotal(){
  const ef=parseFloat(document.getElementById('cp-ef')?.value)||0,tr=parseFloat(document.getElementById('cp-tr')?.value)||0;
  const tot=document.getElementById('cp-tot');if(tot)tot.value=ef+tr>0?$m(ef+tr):'';
}

function calcCostoUnitario(){
  const precio=parseFloat(document.getElementById('ci-precio')?.value)||0;
  const qtyR=parseFloat(document.getElementById('ci-qtyr')?.value)||0;
  const qtyC=parseFloat(document.getElementById('ci-qtyc')?.value)||0;
  const prev=document.getElementById('costo-preview');
  if(!prev)return;
  if(precio&&(qtyR||qtyC)){
    const base=qtyR||qtyC;
    const costo=precio/base;
    const refEl=document.getElementById('ci-ref');
    const unit=refEl?.options[refEl.selectedIndex]?.dataset?.u||'kg';
    prev.textContent=`→ Costo calculado: ${$d2(costo)}/${unit}`;
    prev.style.color='var(--ac)';
  } else {
    prev.textContent='';
  }
}

function selAllProp(){
  sgV().forEach(g=>{const cb=document.getElementById('prop_'+g.id);if(cb)cb.checked=true;});
}

function renderCompraItems(){
  const list=document.getElementById('cp-items-list');if(!list)return;
  if(!compraItems.length){list.innerHTML='';return;}
  const tot=compraItems.reduce((s,x)=>s+x.precio_total,0);
  list.innerHTML=compraItems.map((x,i)=>`<div class="compra-item">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div><div style="font-size:12px;font-weight:500">${esc(x.descripcion)}</div>
        <div style="font-size:10px;color:var(--tx3);font-family:var(--mo)">${x.qty_compra} ${x.unit_compra||''} ${x.qty_real?'→ '+fQ(x.qty_real,x.unit_real):''}</div>
        <div style="font-size:10px;color:var(--ac);font-family:var(--mo)">${$m(x.precio_total)} · costo: ${$d2(x.cost_unit_calculado||0)}/${x.unit_real||'kg'}</div>
      </div>
      <button class="dbtn" onclick="rmCompraItem(${i})">✕</button>
    </div>
  </div>`).join('')
  +`<div style="text-align:right;font-size:12px;font-family:var(--mo);color:var(--ac);padding:5px 0">Total artículos: ${$m(tot)}</div>`;
}

function addCompraItem(){
  const desc=document.getElementById('ci-desc')?.value.trim();
  const refEl=document.getElementById('ci-ref'),refOpt=refEl?.options[refEl.selectedIndex],refVal=refEl?.value;
  const qtyC=parseFloat(document.getElementById('ci-qtyc')?.value)||0;
  const uc=document.getElementById('ci-uc')?.value.trim()||'unidad';
  const qtyR=parseFloat(document.getElementById('ci-qtyr')?.value)||0;
  const precio=parseFloat(document.getElementById('ci-precio')?.value)||0;
  if(!desc||!qtyC||!precio)return alert('Completá descripción, cantidad y precio');
  const unitReal=refOpt?.dataset?.u||'kg';
  const base=qtyR||qtyC;
  const costCalc=precio/base;
  const isStock=refVal?.startsWith('sgv_');
  const isIns=refVal?.startsWith('ins_');
  const ref_id=refVal?.replace(/^(sgv_|ins_)/,'');
  compraItems.push({
    descripcion:desc,
    tipo_destino:isStock?'stock_venta':isIns?'insumo':'otro',
    ref_id,qty_compra:qtyC,unit_compra:uc,qty_real:qtyR||qtyC,unit_real:unitReal,
    precio_total:precio,cost_unit_calculado:costCalc
  });
  document.getElementById('ci-desc').value='';
  document.getElementById('ci-qtyc').value='';
  document.getElementById('ci-qtyr').value='';
  document.getElementById('ci-precio').value='';
  const prev=document.getElementById('costo-preview');if(prev)prev.textContent='';
  renderCompraItems();
}
function rmCompraItem(i){compraItems.splice(i,1);renderCompraItems();}

async function saveCompra(){
  const prov=document.getElementById('cp-prov')?.value.trim();
  const fact=document.getElementById('cp-fact')?.value.trim();
  const note=document.getElementById('cp-note')?.value.trim();
  const ef=parseFloat(document.getElementById('cp-ef')?.value)||0;
  const tr=parseFloat(document.getElementById('cp-tr')?.value)||0;
  if(!prov)return alert('Ingresá el proveedor');
  if(!compraItems.length)return alert('Agregá al menos un artículo');
  const totalPago=ef+tr;
  const totalItems=compraItems.reduce((s,x)=>s+x.precio_total,0);
  const total=totalPago||totalItems;

  // grupos a los que propagar el costo/kg (checkboxes marcados)
  const propagarA=sgV().filter(g=>{const cb=document.getElementById('prop_'+g.id);return cb&&cb.checked;}).map(g=>g.id);

  // calcular costo/kg global de esta compra (total ÷ kg reales totales de artículos de pollo)
  const polloItems=compraItems.filter(x=>x.tipo_destino==='stock_venta'||x.tipo_destino==='insumo');
  const kgTotales=polloItems.reduce((s,x)=>s+(x.qty_real||x.qty_compra),0);
  const costoKgGlobal=kgTotales>0?total/kgTotales:(compraItems[0]?.cost_unit_calculado||0);

  const compraId=uid();
  const compra={
    id:compraId,day,proveedor:prov,nro_factura:fact||null,total,
    pago_efectivo:ef,pago_transferencia:tr,
    grupos_propagados:JSON.stringify(propagarA),
    note:note||null,time:arTime()
  };
  const items=compraItems.map(x=>({id:uid(),compra_id:compraId,...x}));

  // actualizar costo en artículos individuales
  items.forEach(x=>{
    if(x.tipo_destino==='stock_venta'){
      const g=S.sg.find(sg=>sg.id===x.ref_id);
      if(g)g.cost_unit=x.cost_unit_calculado||g.cost_unit;
    } else if(x.tipo_destino==='insumo'){
      const ins=S.ins.find(i=>i.id===x.ref_id);
      if(ins){ins.costUnit=x.cost_unit_calculado||ins.costUnit;ins.cost_unit=ins.costUnit;}
    }
  });

  // propagar costo/kg global a los grupos seleccionados
  propagarA.forEach(gid=>{
    const g=S.sg.find(x=>x.id===gid);
    if(g)g.cost_unit=costoKgGlobal;
  });

  // registrar gasto automático — guardamos su ID dentro de la compra para poder borrarlo exactamente
  const gastoId=uid();
  const gastoRow={id:gastoId,day,descripcion:'Compra: '+prov+(fact?' F/'+fact:''),cat:'Materia prima',amount:total,time:arTime()};
  if(!S.ga[day])S.ga[day]=[];S.ga[day].push(gastoRow);

  // guardamos el gasto_id dentro de la compra para vincularlo
  compra.gasto_id=gastoId;

  S.co.push(compra);S.coi.push(...items);compraItems=[];save();render();

  if(online){sync('busy','guardando...');try{
    await sbUp('compras',compra);
    if(items.length)await sbUp('compras_items',items);
    await sbUp('gastos',gastoRow);
    // actualizar todos los grupos afectados en Supabase
    const changedIds=[...new Set([...items.map(x=>x.ref_id),...propagarA])];
    for(const id of changedIds){
      const g=S.sg.find(x=>x.id===id);
      if(g)await sbUp('stock_groups',{id:g.id,name:g.name,unit:g.unit,tipo:g.tipo,stock_qty:g.stock_qty,cost_unit:g.cost_unit||0});
      const ins=S.ins.find(x=>x.id===id);
      if(ins)await sbUp('insumos',{id:ins.id,name:ins.name,unit:ins.unit,cost_unit:ins.costUnit});
    }
    sync('ok','guardado');
    toast(`Costo/kg actualizado en ${propagarA.length} grupo(s) ✓`);
  }catch(e){sync('err','error');console.error(e)}}
}

async function delCompra(id){
  if(!confirm('¿Eliminar esta factura? Se eliminará el gasto asociado.'))return;
  const c=S.co.find(x=>x.id===id);
  if(!c)return;

  // 1. Eliminar el gasto vinculado usando gasto_id exacto
  if(c.gasto_id){
    // local
    Object.keys(S.ga).forEach(d=>{S.ga[d]=(S.ga[d]||[]).filter(g=>g.id!==c.gasto_id);});
    // remoto
    if(online){try{await sbDel('gastos',c.gasto_id);}catch(e){console.error('del gasto',e)}}
  } else {
    // fallback: buscar por descripción y monto en el día de la compra
    const desc='Compra: '+c.proveedor+(c.nro_factura?' F/'+c.nro_factura:'');
    const gaDay=S.ga[c.day]||[];
    const match=gaDay.find(g=>g.descripcion===desc&&g.amount===c.total);
    if(match){
      S.ga[c.day]=gaDay.filter(g=>g.id!==match.id);
      if(online){try{await sbDel('gastos',match.id);}catch(e){}}
    }
  }

  // 2. Eliminar compra e items local y remoto
  S.co=S.co.filter(x=>x.id!==id);
  S.coi=S.coi.filter(x=>x.compra_id!==id);
  save();render();
  if(online){try{await sbDel('compras',id);}catch(e){console.error('del compra',e)}}
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
  const tvEf=vs.filter(v=>v.pago==='Efectivo').reduce((s,v)=>s+v.total,0);
  const tvTr=tv-tvEf;
  const byG={};
  vs.forEach(v=>{const g=S.sg.find(x=>x.id===v.group_id),gn=g?g.name:'Otros';if(!byG[gn])byG[gn]={qty:0,tot:0,ef:0,tr:0,unit:g?.unit||''};byG[gn].qty+=(v.stock_used||0);byG[gn].tot+=v.total;if(v.pago==='Efectivo')byG[gn].ef+=v.total;else byG[gn].tr+=v.total;});
  const tg=Object.entries(S.ga).filter(([d])=>d.startsWith(ym)).flatMap(([,g])=>g).reduce((s,g)=>s+g.amount,0);
  const movs=Object.entries(S.caja).filter(([d])=>d.startsWith(ym)).flatMap(([,m])=>m);
  const ingEf=movs.filter(m=>m.tipo==='ingreso'&&m.metodo==='efectivo').reduce((s,m)=>s+m.monto,0);
  const ingTr=movs.filter(m=>m.tipo==='ingreso'&&m.metodo==='transferencia').reduce((s,m)=>s+m.monto,0);
  const egEf=movs.filter(m=>m.tipo==='egreso'&&m.metodo==='efectivo').reduce((s,m)=>s+m.monto,0);
  const egTr=movs.filter(m=>m.tipo==='egreso'&&m.metodo==='transferencia').reduce((s,m)=>s+m.monto,0);
  return{vs,tv,tvEf,tvTr,tg,byG,ingEf,ingTr,egEf,egTr};
}

function dayData(d){
  const vs=S.ve[d]||[],tv=vs.reduce((s,v)=>s+v.total,0);
  const tvEf=vs.filter(v=>v.pago==='Efectivo').reduce((s,v)=>s+v.total,0);
  const byG={};
  vs.forEach(v=>{const g=S.sg.find(x=>x.id===v.group_id),gn=g?g.name:'Otros';if(!byG[gn])byG[gn]={qty:0,tot:0,ef:0,tr:0,unit:g?.unit||''};byG[gn].qty+=(v.stock_used||0);byG[gn].tot+=v.total;if(v.pago==='Efectivo')byG[gn].ef+=v.total;else byG[gn].tr+=v.total;});
  const tg=(S.ga[d]||[]).reduce((s,g)=>s+g.amount,0);
  return{vs,tv,tvEf,tvTr:tv-tvEf,byG,tg};
}

function yrData(yr){const ms=[];for(let m=1;m<=12;m++){const ym=yr+'-'+m.toString().padStart(2,'0');const{tv,tg}=mData(ym);ms.push({lbl:fM(ym).split(' ')[0],tv,tg,res:tv-tg})}return ms}

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

function rRepDia(){
  const{vs,tv,tvEf,tvTr,byG,tg}=dayData(day);const res=tv-tg;
  const bgRows=Object.entries(byG).sort((a,b)=>b[1].tot-a[1].tot).map(([n,d])=>`<tr>
    <td>${esc(n)}</td>
    <td style="font-family:var(--mo)">${fQ(d.qty,d.unit)}</td>
    <td style="font-family:var(--mo)">${$m(d.tot)}</td>
    <td style="font-family:var(--mo);color:var(--gn)">${$m(d.ef)}</td>
    <td style="font-family:var(--mo);color:var(--bl)">${$m(d.tr)}</td>
  </tr>`).join('')||`<tr><td colspan="5" class="empty-row">Sin ventas</td></tr>`;
  return`
  <div style="font-size:11px;color:var(--tx2);font-family:var(--mo);margin-bottom:10px">📅 ${fDL(day)}</div>
  <div class="kpis t3">
    <div class="kc hi"><div class="kl">Ventas</div><div class="kv a">${$m(tv)}</div></div>
    <div class="kc"><div class="kl">Gastos</div><div class="kv r">${$m(tg)}</div></div>
    <div class="kc"><div class="kl">Resultado</div><div class="kv ${res>=0?'g':'r'}">${$m(res)}</div></div>
  </div>
  <div class="kpis">
    <div class="kc"><div class="kl">Efectivo</div><div class="kv g">${$m(tvEf)}</div></div>
    <div class="kc"><div class="kl">Transferencias</div><div class="kv b">${$m(tvTr)}</div></div>
  </div>
  <div class="tbk"><div class="tt">Ventas por grupo — ${fDL(day)}</div>
    <table><thead><tr><th>Grupo</th><th>Cantidad</th><th>Total</th><th>Efectivo</th><th>Transf.</th></tr></thead><tbody>${bgRows}</tbody></table>
  </div>
  <button class="btn btng" onclick="exportExcel()" style="width:100%;margin-top:6px">⬇ Exportar todo a Excel</button>`;
}

function rRepMes(mthTabs){
  const{tv,tvEf,tvTr,tg,byG}=mData(rMonth);const res=tv-tg;
  const[yr,mo]=rMonth.split('-').map(Number);const dc=new Date(yr,mo,0).getDate();
  const bgRows=Object.entries(byG).sort((a,b)=>b[1].tot-a[1].tot).map(([n,d])=>`<tr>
    <td>${esc(n)}</td><td style="font-family:var(--mo)">${fQ(d.qty,d.unit)}</td>
    <td style="font-family:var(--mo)">${$m(d.tot)}</td>
    <td style="font-family:var(--mo);color:var(--gn)">${$m(d.ef)}</td>
    <td style="font-family:var(--mo);color:var(--bl)">${$m(d.tr)}</td>
  </tr>`).join('')||`<tr><td colspan="5" class="empty-row">Sin datos</td></tr>`;
  return`
  <div class="mtabs">${mthTabs}</div>
  <div class="kpis t3">
    <div class="kc hi"><div class="kl">Ventas</div><div class="kv a">${$m(tv)}</div></div>
    <div class="kc"><div class="kl">Gastos</div><div class="kv r">${$m(tg)}</div></div>
    <div class="kc"><div class="kl">Resultado</div><div class="kv ${res>=0?'g':'r'}">${$m(res)}</div></div>
  </div>
  <div class="kpis">
    <div class="kc"><div class="kl">Ef. del mes</div><div class="kv g">${$m(tvEf)}</div></div>
    <div class="kc"><div class="kl">Transf. del mes</div><div class="kv b">${$m(tvTr)}</div></div>
  </div>
  <div class="blk"><div class="bt">Ventas diarias — ${fM(rMonth)}</div><div class="ch-w"><canvas id="cM"></canvas></div></div>
  <div class="tbk"><div class="tt">Acumulado por grupo</div>
    <table><thead><tr><th>Grupo</th><th>Cantidad</th><th>Total</th><th>Efectivo</th><th>Transf.</th></tr></thead><tbody>${bgRows}</tbody></table>
  </div>
  <button class="btn btng" onclick="exportExcel()" style="width:100%;margin-top:6px">⬇ Exportar todo a Excel</button>`;
}

function rRepAnual(yr){
  const an=yrData(yr);const totV=an.reduce((s,x)=>s+x.tv,0),totG=an.reduce((s,x)=>s+x.tg,0);
  const rows=an.map(m=>`<tr><td>${m.lbl}</td><td style="font-family:var(--mo);color:var(--ac)">${$m(m.tv)}</td><td style="font-family:var(--mo);color:var(--rd)">${$m(m.tg)}</td><td style="font-family:var(--mo);font-weight:500;color:${m.res>=0?'var(--gn)':'var(--rd)'}">${$m(m.res)}</td></tr>`).join('');
  return`
  <div class="kpis t3">
    <div class="kc hi"><div class="kl">Ventas ${yr}</div><div class="kv a">${$m(totV)}</div></div>
    <div class="kc"><div class="kl">Gastos ${yr}</div><div class="kv r">${$m(totG)}</div></div>
    <div class="kc"><div class="kl">Resultado</div><div class="kv ${totV-totG>=0?'g':'r'}">${$m(totV-totG)}</div></div>
  </div>
  <div class="blk"><div class="bt">Ventas vs Gastos — ${yr}</div><div class="ch-w" style="height:155px"><canvas id="cA"></canvas></div></div>
  <div class="tbk"><div class="tt">Detalle mensual ${yr}</div>
    <table><thead><tr><th>Mes</th><th>Ventas</th><th>Gastos</th><th>Resultado</th></tr></thead><tbody>${rows}</tbody></table>
  </div>
  <button class="btn btng" onclick="exportExcel()" style="width:100%;margin-top:6px">⬇ Exportar todo a Excel</button>`;
}

function rRepFin(mthTabs){
  const{tv,tvEf,tvTr,tg,byG,ingEf,ingTr,egEf,egTr}=mData(rMonth);
  const ganancia=tv-tg,margen=tv>0?Math.round((ganancia/tv)*100):0;
  const margenCol=margen>30?'var(--gn)':margen>10?'var(--ac)':'var(--rd)';
  const catGas={};Object.entries(S.ga).filter(([d])=>d.startsWith(rMonth)).flatMap(([,g])=>g).forEach(g=>{catGas[g.cat]=(catGas[g.cat]||0)+g.amount});
  const catRows=Object.entries(catGas).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<tr><td>${c}</td><td style="font-family:var(--mo)">${$m(v)}</td><td style="font-family:var(--mo);color:var(--tx3)">${Math.round(tg>0?(v/tg)*100:0)}%</td></tr>`).join('')||`<tr><td colspan="3" class="empty-row">Sin gastos</td></tr>`;
  return`
  <div class="mtabs">${mthTabs}</div>
  <div class="kpis t3">
    <div class="kc hi"><div class="kl">Ingresos</div><div class="kv a">${$m(tv)}</div></div>
    <div class="kc"><div class="kl">Gastos</div><div class="kv r">${$m(tg)}</div></div>
    <div class="kc"><div class="kl">Ganancia</div><div class="kv ${ganancia>=0?'g':'r'}">${$m(ganancia)}</div></div>
  </div>
  <div class="kpis t3">
    <div class="kc"><div class="kl">Margen</div><div class="kv" style="color:${margenCol}">${margen}%</div></div>
    <div class="kc"><div class="kl">Efectivo total</div><div class="kv g" style="font-size:14px">${$m(tvEf+ingEf-egEf)}</div></div>
    <div class="kc"><div class="kl">Digital total</div><div class="kv b" style="font-size:14px">${$m(tvTr+ingTr-egTr)}</div></div>
  </div>
  <div class="tbk"><div class="tt">Gastos por categoría</div>
    <table><thead><tr><th>Categoría</th><th>Monto</th><th>%</th></tr></thead><tbody>${catRows}</tbody></table>
  </div>
  <button class="btn btng" onclick="exportExcel()" style="width:100%;margin-top:6px">⬇ Exportar todo a Excel</button>`;
}

function initCharts(){
  const ym=rMonth,yr=ym.split('-')[0];
  const[y2,mo]=ym.split('-').map(Number);const dc=new Date(y2,mo,0).getDate();
  const labs=[],dV=[],dG=[];
  for(let d=1;d<=dc;d++){const ds=ym+'-'+d.toString().padStart(2,'0');labs.push(d);dV.push((S.ve[ds]||[]).reduce((s,x)=>s+x.total,0));dG.push((S.ga[ds]||[]).reduce((s,x)=>s+x.amount,0));}
  const OPTS={responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#8a8680',font:{size:9,family:'DM Mono'}}}},scales:{x:{ticks:{color:'#4e4b48',font:{size:8}},grid:{color:'#252525'}},y:{ticks:{color:'#4e4b48',font:{size:9},callback:v=>'$'+Math.round(v).toLocaleString('es-AR')},grid:{color:'#252525'}}}};
  const cm=document.getElementById('cM');
  if(cm&&window.Chart){try{if(charts.cM)charts.cM.destroy()}catch(e){}charts.cM=new Chart(cm,{type:'bar',data:{labels:labs,datasets:[{label:'Ventas',data:dV,backgroundColor:'rgba(232,197,71,.7)',borderRadius:3},{label:'Gastos',data:dG,backgroundColor:'rgba(248,113,113,.45)',borderRadius:3}]},options:OPTS});}
  const ca=document.getElementById('cA');
  if(ca&&window.Chart){try{if(charts.cA)charts.cA.destroy()}catch(e){}const an=yrData(yr);charts.cA=new Chart(ca,{type:'line',data:{labels:an.map(x=>x.lbl),datasets:[{label:'Ventas',data:an.map(x=>x.tv),borderColor:'rgba(232,197,71,.9)',backgroundColor:'rgba(232,197,71,.07)',tension:.3,fill:true,pointRadius:3,borderWidth:2},{label:'Gastos',data:an.map(x=>x.tg),borderColor:'rgba(248,113,113,.7)',backgroundColor:'transparent',tension:.3,pointRadius:3,borderWidth:1.5,borderDash:[4,3]}]},options:OPTS});}
}

/* ══════════════════════════════════════════
   EXPORT EXCEL
══════════════════════════════════════════ */
function exportExcel(){
  if(!window.XLSX){alert('Librería cargando, intentá en unos segundos');return;}
  const wb=XLSX.utils.book_new();
  // Ventas
  const va=[['Fecha','Hora','Grupo','Variante','Cant.','Stock usado','Unidad','Precio unit.','Desc %','Total','Pago']];
  Object.entries(S.ve).sort(([a],[b])=>a.localeCompare(b)).forEach(([d,vs])=>vs.forEach(v=>{const vr=S.vr.find(x=>x.id===v.variant_id),gr=S.sg.find(x=>x.id===v.group_id);va.push([fDL(d),v.time||'',gr?.name||'',vr?.name||'',v.qty,v.stock_used||0,gr?.unit||'',v.price_unit,v.descuento_pct||0,v.total,v.pago]);}));
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(va),'Ventas');
  // Gastos
  const ga=[['Fecha','Hora','Descripción','Categoría','Monto']];
  Object.entries(S.ga).sort(([a],[b])=>a.localeCompare(b)).forEach(([d,gs])=>gs.forEach(g=>ga.push([fDL(d),g.time||'',g.descripcion,g.cat,g.amount])));
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(ga),'Gastos');
  // Compras
  const ca2=[['Fecha','Hora','Proveedor','Nro Factura','Total','Efectivo','Transferencia','Nota']];
  S.co.forEach(c=>ca2.push([fDL(c.day),c.time||'',c.proveedor,c.nro_factura||'',c.total,c.pago_efectivo||0,c.pago_transferencia||0,c.note||'']));
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(ca2),'Compras');
  // Cortes
  const cta=[['Fecha','Hora','Corte','Grupo','Cantidad','Unidad']];
  S.ct.forEach(c=>{const items=S.cti.filter(i=>i.corte_id===c.id);items.forEach(i=>cta.push([fDL(c.day),c.time||'',c.nombre,i.nombre,i.qty,i.unit||'']));});
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(cta),'Cortes');
  // Elaboraciones
  const ela=[['Fecha','Hora','Elaboración','Ingrediente','Tipo','Cantidad','Unidad','Costo ref.']];
  S.el.forEach(e=>{const items=S.eli.filter(i=>i.elaboracion_id===e.id);items.forEach(i=>ela.push([fDL(e.day),e.time||'',e.nombre,i.nombre,i.tipo,i.qty,i.unit||'',i.costo_subtotal||0]));});
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(ela),'Elaboraciones');
  // Caja movimientos
  const cja=[['Fecha','Hora','Tipo','Descripción','Método','Monto']];
  Object.entries(S.caja).sort(([a],[b])=>a.localeCompare(b)).forEach(([d,ms])=>ms.forEach(m=>cja.push([fDL(d),m.time||'',m.tipo,m.descripcion,m.metodo,m.monto])));
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(cja),'Caja');
  // Resumen mensual
  const rm=[['Mes','Ventas','Efectivo','Transferencias','Gastos','Resultado']];
  getMths().forEach(ym=>{const{tv,tvEf,tvTr,tg}=mData(ym);rm.push([fM(ym),tv,tvEf,tvTr,tg,tv-tg]);});
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rm),'Resumen mensual');
  // Stock actual
  const sta=[['Nombre','Tipo','Unidad','Stock actual','Costo/unidad']];
  S.sg.forEach(g=>sta.push([g.name,g.tipo||'venta',g.unit||'kg',g.stock_qty||0,g.cost_unit||0]));
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(sta),'Stock');
  XLSX.writeFile(wb,`LosPollosCunados_${arDay().replace(/-/g,'')}.xlsx`);
  toast('Excel descargado ✓');
}

/* ══════════════════════════════════════════
   BOOT
══════════════════════════════════════════ */
if(sesion){
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app-screen').style.display='block';
  initApp();
} else {
  fetch(SB+'/rest/v1/usuarios',{headers:SBH}).then(r=>r.json()).then(us=>{if(us?.length)S.us=us;}).catch(()=>{});
}

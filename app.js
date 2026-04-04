/* ═══════════════════════════════════════════════════════
   LOS POLLOS CUÑADOS — app.js
═══════════════════════════════════════════════════════ */
const SB='https://pfxvkvvzxpwobtynupgk.supabase.co';
const SK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmeHZrdnZ6eHB3b2J0eW51cGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjM3NjIsImV4cCI6MjA5MDczOTc2Mn0.H2tqmv0T9npDmNW3Pid2qnUSze7EHvO1ky0-NQzmFIY';
const H={'apikey':SK,'Authorization':'Bearer '+SK,'Content-Type':'application/json','Prefer':'return=minimal'};

async function sbQ(t,q=''){const r=await fetch(SB+'/rest/v1/'+t+'?'+q,{headers:H});if(!r.ok)throw new Error(await r.text());return r.json();}
async function sbUp(t,d){const r=await fetch(SB+'/rest/v1/'+t,{method:'POST',headers:{...H,'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(Array.isArray(d)?d:[d])}); if(!r.ok)throw new Error(await r.text());}
async function sbDel(t,id){const r=await fetch(SB+'/rest/v1/'+t+'?id=eq.'+encodeURIComponent(id),{method:'DELETE',headers:H});if(!r.ok)throw new Error(await r.text());}

/* ── LOCAL CACHE ── */
const LC={g(k){try{return JSON.parse(localStorage.getItem('lpc_'+k))||null}catch{return null}},s(k,v){localStorage.setItem('lpc_'+k,JSON.stringify(v))}};

/* ── STATE ── */
let S={
  sg:   LC.g('sg')||[],   // stock_groups (tipo: venta | produccion)
  vr:   LC.g('vr')||[],   // stock_variants
  pr:   LC.g('pr')||[],   // produccion lotes
  pri:  LC.g('pri')||[],  // produccion_items
  ve:   LC.g('ve')||{},   // ventas por dia
  ga:   LC.g('ga')||{},   // gastos por dia
  ins:  LC.g('ins')||[],  // insumos
};

let tab='caja', day=td(), online=navigator.onLine;
let lotItems=[];  // items temporales del lote de producción en edición
let cM=null, cA=null, rMonth=nm();

/* ── UTILS ── */
function td(){return new Date().toISOString().split('T')[0]}
function nm(){const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1).toString().padStart(2,'0')}
function fD(s){const[,m,d]=s.split('-');return d+'/'+m}
function fDL(s){const[y,m,d]=s.split('-');return d+'/'+m+'/'+y}
function fM(s){const[y,m]=s.split('-');return['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][+m-1]+' '+y}
function $m(n){return'$'+Math.round(n).toLocaleString('es-AR')}
function $d2(n){return'$'+(+n).toFixed(2)}
function kg(n){return(+(+n).toFixed(2))+'kg'}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,5)}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function dV(){return S.ve[day]||[]}
function dG(){return S.ga[day]||[]}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),2200)}
function sync(s,l){const d=document.getElementById('sdot'),lb=document.getElementById('slbl');if(d){d.className='sdot '+s;lb.textContent=l}}
function save(){LC.s('sg',S.sg);LC.s('vr',S.vr);LC.s('pr',S.pr);LC.s('pri',S.pri);LC.s('ve',S.ve);LC.s('ga',S.ga);LC.s('ins',S.ins)}
function sgVenta(){return S.sg.filter(g=>g.tipo==='venta'||!g.tipo)}
function sgProd(){return S.sg.filter(g=>g.tipo==='produccion')}

window.addEventListener('online',()=>{online=true;loadAll()});
window.addEventListener('offline',()=>{online=false;sync('err','offline')});

/* ── LOAD ── */
async function loadAll(){
  if(!online){sync('err','offline');return}
  sync('busy','cargando...');
  try{
    const[sg,vr,pr,pri,ve,ga,ins]=await Promise.all([
      sbQ('stock_groups','order=name'),
      sbQ('stock_variants','order=name'),
      sbQ('produccion','order=created_at'),
      sbQ('produccion_items','order=created_at'),
      sbQ('ventas','order=created_at'),
      sbQ('gastos','order=created_at'),
      sbQ('insumos','order=name'),
    ]);
    S.sg=sg.map(g=>({...g,cost_kg:g.cost_kg||0}));
    S.vr=vr;
    S.pr=pr.map(p=>({...p,date:p.day}));
    S.pri=pri;
    S.ins=ins.map(i=>({...i,costUnit:i.cost_unit||0}));
    const vm={},gm={};
    ve.forEach(x=>{if(!vm[x.day])vm[x.day]=[];vm[x.day].push(x)});
    ga.forEach(x=>{if(!gm[x.day])gm[x.day]=[];gm[x.day].push(x)});
    S.ve=vm;S.ga=gm;
    save();sync('ok','sincronizado');render();
  }catch(e){sync('err','error sync');console.error(e)}
}

/* ── NAV ── */
function go(t){tab=t;document.querySelectorAll('.bni').forEach(el=>el.classList.toggle('active',el.id==='bn-'+t));render()}
function chDay(d){const dt=new Date(day+'T12:00:00');dt.setDate(dt.getDate()+d);const nd=dt.toISOString().split('T')[0];if(nd>td())return;day=nd;render()}

function render(){
  const isT=day===td();
  document.getElementById('hdr-sub').textContent=(isT?'Hoy · ':'')+fDL(day);
  document.getElementById('dnd').textContent=isT?'Hoy':fD(day);
  cM=null;cA=null;
  const c=document.getElementById('content');
  if(tab==='caja')c.innerHTML=rCaja();
  else if(tab==='stock')c.innerHTML=rStock();
  else if(tab==='prod'){c.innerHTML=rProd();renderLotItems();}
  else if(tab==='gastos')c.innerHTML=rGastos();
  else if(tab==='reportes'){c.innerHTML=rReportes();initCharts();}
}

/* ══════════════════════════════════════════
   CAJA
══════════════════════════════════════════ */
function rCaja(){
  const vs=dV(),tv=vs.reduce((s,v)=>s+v.total,0);
  const ef=vs.filter(v=>v.pago==='Efectivo').reduce((s,v)=>s+v.total,0);
  const ga=dG().reduce((s,g)=>s+g.amount,0),res=tv-ga;
  const opts=S.vr.map(v=>{const g=sgVenta().find(x=>x.id===v.group_id);return`<option value="${v.id}" data-p="${v.price}" data-k="${v.kg_per_unit}">${esc(g?g.name+' › ':'')}${esc(v.name)} (${v.kg_per_unit}kg/u)</option>`}).join('');
  const rows=vs.length?vs.map(v=>{
    const vr=S.vr.find(x=>x.id===v.variant_id);
    const gr=S.sg.find(x=>x.id===v.group_id);
    return`<tr>
      <td>${v.time||''}</td>
      <td style="max-width:95px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc((gr?gr.name+' › ':'')+vr?.name)}">${esc(gr?gr.name:'–')}${vr?': '+esc(vr.name):''}</td>
      <td>${v.qty}</td>
      <td style="color:var(--tx3)">${kg(v.kg_total||0)}</td>
      <td>${$m(v.total)}</td>
      <td><span class="tag tv">${(v.pago||'').slice(0,3)}</span></td>
      <td><button class="dbtn" onclick="delV('${v.id}')">✕</button></td>
    </tr>`;
  }).join(''):`<tr><td colspan="7" class="empty-row">Sin ventas registradas</td></tr>`;

  return`
  <div class="kpis">
    <div class="kc hi"><div class="kl">Ventas del día</div><div class="kv a">${$m(tv)}</div><div class="kh">${vs.length} registros</div></div>
    <div class="kc"><div class="kl">Resultado</div><div class="kv ${res>=0?'g':'r'}">${$m(res)}</div><div class="kh">ventas − gastos</div></div>
    <div class="kc"><div class="kl">Efectivo</div><div class="kv">${$m(ef)}</div></div>
    <div class="kc"><div class="kl">Digital</div><div class="kv">${$m(tv-ef)}</div></div>
  </div>
  <div class="blk">
    <div class="bt">Registrar venta</div>
    <div class="fr">
      <div class="fl" style="flex:3"><label>Variante</label>
        <select id="v-var" onchange="onVC()">${opts||'<option value="">Sin variantes — creá en Stock</option>'}</select>
      </div>
      <div class="fl" style="max-width:60px"><label>Cant.</label>
        <input type="number" id="v-qty" value="1" min="0.1" step="0.1" oninput="calcT()">
      </div>
    </div>
    <div class="fr">
      <div class="fl"><label>Precio unit. $</label><input type="number" id="v-price" placeholder="0" oninput="calcT()"></div>
      <div class="fl"><label>Subtotal</label><input type="text" id="v-tot" readonly style="color:var(--ac)"></div>
      <div class="fl"><label>Pago</label>
        <select id="v-pago"><option>Efectivo</option><option>Transferencia</option><option>Débito</option><option>Crédito</option></select>
      </div>
    </div>
    <div class="fr">
      <div class="fl"><label>Descuenta del stock</label>
        <input type="text" id="v-kgd" readonly style="color:var(--tx3);font-size:11px" placeholder="automático">
      </div>
      <button class="btn btnp" onclick="addV()" style="align-self:flex-end">+ Agregar</button>
    </div>
  </div>
  <div class="tbk">
    <div class="tt">Ventas del día</div>
    <table><thead><tr><th>Hora</th><th>Producto</th><th>Cant</th><th>−kg</th><th>Total</th><th>Pago</th><th></th></tr></thead>
    <tbody>${rows}</tbody></table>
  </div>`;
}

function onVC(){
  const s=document.getElementById('v-var'),o=s?.options[s.selectedIndex];
  if(!o)return;
  document.getElementById('v-price').value=o.dataset.p||'';
  calcT();
}
function calcT(){
  const s=document.getElementById('v-var'),o=s?.options[s.selectedIndex];
  const k=parseFloat(o?.dataset?.k)||1,q=parseFloat(document.getElementById('v-qty')?.value)||0,p=parseFloat(document.getElementById('v-price')?.value)||0;
  const td2=document.getElementById('v-tot'),kd=document.getElementById('v-kgd');
  if(td2)td2.value=q*p?$m(q*p):'';
  if(kd)kd.value=q*k?'−'+(q*k).toFixed(2)+'kg del grupo':'';
}
async function addV(){
  const s=document.getElementById('v-var'),o=s?.options[s.selectedIndex];
  const varId=s?.value,kpu=parseFloat(o?.dataset?.k)||1,qty=parseFloat(document.getElementById('v-qty').value)||0,price=parseFloat(document.getElementById('v-price').value)||0,pago=document.getElementById('v-pago').value;
  if(!varId||!qty||!price)return alert('Completá todos los campos');
  const vr=S.vr.find(x=>x.id===varId);if(!vr)return;
  const gr=S.sg.find(x=>x.id===vr.group_id);if(!gr)return;
  const kgT=qty*kpu;
  if((gr.stock_kg||0)<kgT&&!confirm(`Stock bajo en ${gr.name}: quedan ${(gr.stock_kg||0).toFixed(2)}kg. ¿Continuar igual?`))return;
  const time=new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
  const row={id:uid(),day,variant_id:varId,group_id:vr.group_id,qty,kg_total:kgT,price_unit:price,total:qty*price,pago,time};
  if(!S.ve[day])S.ve[day]=[];
  S.ve[day].push(row);
  gr.stock_kg=Math.max(0,(gr.stock_kg||0)-kgT);
  save();render();
  if(online){sync('busy','guardando...');try{await sbUp('ventas',row);await sbUp('stock_groups',{id:gr.id,name:gr.name,unit:gr.unit,tipo:gr.tipo,stock_kg:gr.stock_kg,cost_kg:gr.cost_kg||0});sync('ok','guardado')}catch(e){sync('err','error')}}
}
async function delV(id){
  const vs=S.ve[day]||[],item=vs.find(x=>x.id===id);
  if(item){const g=S.sg.find(x=>x.id===item.group_id);if(g)g.stock_kg=(g.stock_kg||0)+(item.kg_total||0);}
  S.ve[day]=vs.filter(x=>x.id!==id);save();render();
  if(online){try{await sbDel('ventas',id);const g=S.sg.find(x=>x.id===item?.group_id);if(g)await sbUp('stock_groups',{id:g.id,name:g.name,unit:g.unit,tipo:g.tipo,stock_kg:g.stock_kg,cost_kg:g.cost_kg||0});}catch(e){}}
}

/* ══════════════════════════════════════════
   STOCK
══════════════════════════════════════════ */
function rStock(){
  const low=sgVenta().filter(g=>(g.stock_kg||0)<2);
  const alrt=low.length?`<div class="alrt">⚠ Stock bajo: ${low.map(g=>esc(g.name)+' ('+kg(g.stock_kg||0)+')').join(', ')}</div>`:'';

  const sgRows=(tipo)=>S.sg.filter(g=>(g.tipo||'venta')===tipo).map(g=>{
    const max=Math.max(...S.sg.filter(x=>(x.tipo||'venta')===tipo).map(x=>x.stock_kg||0),1);
    const pct=Math.min(100,Math.round(((g.stock_kg||0)/max)*100));
    const col=(g.stock_kg||0)<2?'var(--rd)':(g.stock_kg||0)<5?'var(--or)':'var(--gn)';
    const vars=S.vr.filter(v=>v.group_id===g.id);
    const extraCol=tipo==='produccion'?`<td>${$d2(g.cost_kg||0)}/kg<br><input type="number" class="ip" value="${g.cost_kg||0}" step="0.01" min="0" onchange="updGCost('${g.id}',this.value)" title="Precio de costo/kg"></td>`:`<td></td>`;
    return`<tr>
      <td>
        <div style="font-size:12px">${esc(g.name)}</div>
        ${tipo==='venta'?`<div style="font-size:10px;color:var(--tx3)">${vars.map(v=>esc(v.name)).join(', ')||'sin variantes'}</div>`:''}
        <div class="sb-w"><div class="sb" style="width:${pct}%;background:${col}"></div></div>
      </td>
      <td style="color:${col};font-family:var(--mo);font-weight:500">${kg(g.stock_kg||0)}</td>
      <td><input type="number" class="ip" value="${+(g.stock_kg||0).toFixed(2)}" step="0.1" min="0" onchange="updGS('${g.id}',this.value)"></td>
      ${extraCol}
      <td><button class="dbtn" onclick="delG('${g.id}')">✕</button></td>
    </tr>`;
  }).join('')||`<tr><td colspan="5" class="empty-row">Sin grupos</td></tr>`;

  const vrRows=sgVenta().map(g=>{
    const vars=S.vr.filter(v=>v.group_id===g.id);if(!vars.length)return'';
    return`<tr style="background:rgba(255,255,255,.01)"><td colspan="4" style="padding:5px 12px;font-size:9px;color:var(--tx3);letter-spacing:.5px;text-transform:uppercase;border-top:1px solid var(--br)">${esc(g.name)}</td></tr>`
      +vars.map(v=>`<tr><td style="padding-left:18px">${esc(v.name)}</td><td style="color:var(--tx3)">${v.kg_per_unit}kg/u</td><td><input type="number" class="ip" value="${v.price||0}" onchange="updVP('${v.id}',this.value)"></td><td><button class="dbtn" onclick="delVr('${v.id}')">✕</button></td></tr>`).join('');
  }).join('');
  const grOptV=sgVenta().map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join('');

  return`
  ${alrt}
  <div class="sh">Stock de venta</div>
  <div class="blk"><div class="bt">Nuevo grupo de venta</div>
    <div class="fr">
      <div class="fl" style="flex:2"><label>Nombre</label><input type="text" id="sg-n" placeholder="Ej: Cuartos, Supremas, Alas..."></div>
      <div class="fl" style="max-width:80px"><label>Stock inicial kg</label><input type="number" id="sg-s" placeholder="0" min="0" step="0.1"></div>
      <button class="btn btnp" onclick="addG('venta')" style="align-self:flex-end">+ Crear</button>
    </div>
  </div>
  <div class="tbk"><div class="tt">Stock de venta — ajustá kg directo</div>
    <table><thead><tr><th>Grupo</th><th>Stock</th><th>Ajustar kg</th><th></th><th></th></tr></thead>
    <tbody>${sgRows('venta')}</tbody></table>
  </div>

  <div class="sh">Variantes de venta</div>
  <div class="blk"><div class="bt">Nueva variante</div>
    <div class="fr">
      <div class="fl"><label>Grupo</label><select id="vr-g">${grOptV||'<option>Sin grupos de venta</option>'}</select></div>
      <div class="fl" style="flex:2"><label>Nombre</label><input type="text" id="vr-n" placeholder="Ej: Cuarto x kg, Oferta 3kg, Pata..."></div>
    </div>
    <div class="fr">
      <div class="fl"><label>kg que descuenta c/u</label><input type="number" id="vr-k" placeholder="Ej: 1, 3, 0.35" min="0.01" step="0.01"></div>
      <div class="fl"><label>Precio $</label><input type="number" id="vr-p" placeholder="0"></div>
      <button class="btn btnp" onclick="addVr()" style="align-self:flex-end">+ Crear</button>
    </div>
    <div style="font-size:9px;color:var(--tx3);font-family:var(--mo);margin-top:3px">Ej: "Pata" → 0.35kg del grupo Cuartos | "Oferta 3kg" → 3kg</div>
  </div>
  <div class="tbk"><div class="tt">Variantes — editá precio directo</div>
    <table><thead><tr><th>Variante</th><th>kg/u</th><th>Precio $</th><th></th></tr></thead>
    <tbody>${vrRows||`<tr><td colspan="4" class="empty-row">Sin variantes</td></tr>`}</tbody>
  </div>

  <div class="sh">Stock de producción (materia prima)</div>
  <div class="blk"><div class="bt">Nuevo grupo de producción</div>
    <div class="fr">
      <div class="fl" style="flex:2"><label>Nombre</label><input type="text" id="sgp-n" placeholder="Ej: Pollo para producción, Suprema cruda..."></div>
      <div class="fl" style="max-width:80px"><label>Stock inicial kg</label><input type="number" id="sgp-s" placeholder="0" min="0" step="0.1"></div>
    </div>
    <div class="fr">
      <div class="fl"><label>Precio de costo $/kg</label><input type="number" id="sgp-c" placeholder="0" step="0.01"></div>
      <button class="btn btnp" onclick="addG('produccion')" style="align-self:flex-end">+ Crear</button>
    </div>
    <div style="font-size:9px;color:var(--tx3);font-family:var(--mo);margin-top:3px">Este stock se usa en producción y descuenta kg con su costo, nunca aparece en ventas.</div>
  </div>
  <div class="tbk"><div class="tt">Stock producción — editá costo/kg directo</div>
    <table><thead><tr><th>Materia prima</th><th>Stock</th><th>Ajustar kg</th><th>Costo $/kg</th><th></th></tr></thead>
    <tbody>${sgRows('produccion')}</tbody>
  </div>`;
}

async function addG(tipo){
  const nEl=tipo==='produccion'?document.getElementById('sgp-n'):document.getElementById('sg-n');
  const sEl=tipo==='produccion'?document.getElementById('sgp-s'):document.getElementById('sg-s');
  const cEl=tipo==='produccion'?document.getElementById('sgp-c'):null;
  const n=nEl.value.trim(),s=parseFloat(sEl.value)||0,c=parseFloat(cEl?.value)||0;
  if(!n)return alert('Ingresá un nombre');
  if(S.sg.find(g=>g.name===n&&(g.tipo||'venta')===tipo))return alert('Ya existe un grupo con ese nombre');
  const row={id:uid(),name:n,unit:'kg',stock_kg:s,tipo,cost_kg:c};
  S.sg.push(row);save();render();
  if(online){try{await sbUp('stock_groups',row);sync('ok','guardado')}catch(e){sync('err','error')}}
}
async function updGS(id,v){const g=S.sg.find(x=>x.id===id);if(!g)return;g.stock_kg=parseFloat(v)||0;save();toast('Stock actualizado ✓');if(online){try{await sbUp('stock_groups',{id:g.id,name:g.name,unit:g.unit,tipo:g.tipo,stock_kg:g.stock_kg,cost_kg:g.cost_kg||0});sync('ok','guardado')}catch(e){sync('err','error')}}}
async function updGCost(id,v){const g=S.sg.find(x=>x.id===id);if(!g)return;g.cost_kg=parseFloat(v)||0;save();toast('Costo actualizado ✓');if(online){try{await sbUp('stock_groups',{id:g.id,name:g.name,unit:g.unit,tipo:g.tipo,stock_kg:g.stock_kg,cost_kg:g.cost_kg});sync('ok','guardado')}catch(e){sync('err','error')}}}
async function delG(id){if(!confirm('¿Eliminar grupo?'))return;S.sg=S.sg.filter(x=>x.id!==id);S.vr=S.vr.filter(x=>x.group_id!==id);save();render();if(online){try{await sbDel('stock_groups',id)}catch(e){}}}
async function addVr(){const gid=document.getElementById('vr-g').value,n=document.getElementById('vr-n').value.trim(),k=parseFloat(document.getElementById('vr-k').value)||0,p=parseFloat(document.getElementById('vr-p').value)||0;if(!gid||!n||!k)return alert('Completá todos los campos');const row={id:uid(),group_id:gid,name:n,kg_per_unit:k,price:p};S.vr.push(row);save();render();if(online){try{await sbUp('stock_variants',row);sync('ok','guardado')}catch(e){sync('err','error')}}}
async function updVP(id,v){const vr=S.vr.find(x=>x.id===id);if(!vr)return;vr.price=parseFloat(v)||0;save();toast('Precio actualizado ✓');if(online){try{await sbUp('stock_variants',{id:vr.id,group_id:vr.group_id,name:vr.name,kg_per_unit:vr.kg_per_unit,price:vr.price});sync('ok','guardado')}catch(e){sync('err','error')}}}
async function delVr(id){S.vr=S.vr.filter(x=>x.id!==id);save();render();if(online){try{await sbDel('stock_variants',id)}catch(e){}}}

/* ══════════════════════════════════════════
   PRODUCCIÓN LIBRE
══════════════════════════════════════════ */
function rProd(){
  const todP=S.pr.filter(p=>p.day===day||p.date===day);
  const sgVOpts=sgVenta().map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join('');

  // lotes del día
  const lotRows=todP.length?todP.map(p=>{
    const outG=S.sg.find(x=>x.id===p.output_group_id);
    const items=S.pri.filter(i=>i.produccion_id===p.id);
    const itemList=items.map(i=>`<div style="font-size:10px;color:var(--tx3);padding:2px 0">${esc(i.nombre)}: ${i.qty}${i.unit||'kg'} — ${$m(i.costo_total||0)}</div>`).join('');
    return`<div class="blk" style="margin-bottom:8px;padding:10px 12px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-size:13px;font-weight:600">${esc(p.nombre)}</div>
          <div style="font-size:10px;color:var(--tx3);font-family:var(--mo);margin-top:2px">${p.time||''} ${outG?'→ '+outG.name+' +'+kg(p.output_kg||0):''}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:12px;font-family:var(--mo);color:var(--ac)">Costo: ${$m(p.costo_total||0)}</div>
          <button class="dbtn" onclick="delLote('${p.id}')" style="margin-top:4px">✕</button>
        </div>
      </div>
      ${itemList?`<div style="margin-top:6px;border-top:1px solid var(--br);padding-top:6px">${itemList}</div>`:''}
      ${p.note?`<div style="font-size:10px;color:var(--tx3);margin-top:4px">${esc(p.note)}</div>`:''}
    </div>`;
  }).join(''):`<div class="empty-row" style="margin-bottom:10px">Sin producción registrada hoy</div>`;

  return`
  <div class="sh">Nuevo lote de producción</div>
  <div class="blk">
    <div class="bt">Datos del lote</div>
    <div class="fr">
      <div class="fl" style="flex:2"><label>Nombre del lote</label>
        <input type="text" id="lot-n" placeholder="Ej: Milanesas mañana, Corte tarde...">
      </div>
      <div class="fl"><label>Nota (opcional)</label>
        <input type="text" id="lot-note" placeholder="">
      </div>
    </div>
    <div class="fr">
      <div class="fl" style="flex:2"><label>Resultado → ingresa a stock de venta</label>
        <select id="lot-outg"><option value="">No ingresa a stock</option>${sgVOpts}</select>
      </div>
      <div class="fl" style="max-width:80px"><label>Kg resultantes</label>
        <input type="number" id="lot-outkg" placeholder="0" min="0" step="0.1">
      </div>
    </div>
  </div>

  <div class="blk">
    <div class="bt">Ingredientes del lote</div>
    <div id="lot-items-list"></div>
    <div class="fr" style="margin-top:8px">
      <div class="fl" style="max-width:110px"><label>Tipo</label>
        <select id="li-tipo" onchange="onLiTipo()">
          <option value="stock_prod">Stock producción</option>
          <option value="insumo">Insumo</option>
        </select>
      </div>
      <div class="fl" style="flex:2"><label>Item</label>
        <select id="li-item"></select>
      </div>
      <div class="fl" style="max-width:65px"><label>Cantidad</label>
        <input type="number" id="li-qty" placeholder="0" min="0.01" step="0.01">
      </div>
      <button class="btn" onclick="addLotItem()" style="align-self:flex-end;padding:6px 10px;font-size:11px">+</button>
    </div>
    <div style="margin-top:8px">
      <button class="btn btnp" onclick="saveLote()" style="width:100%">✓ Guardar lote</button>
    </div>
  </div>

  <div class="sh">Producción de hoy</div>
  ${lotRows}
  ${rInsumosSection()}`;
}

function onLiTipo(){
  const t=document.getElementById('li-tipo')?.value;
  const s=document.getElementById('li-item');
  if(!s)return;
  if(t==='stock_prod'){
    s.innerHTML=sgProd().map(g=>`<option value="${g.id}" data-cu="${g.cost_kg||0}" data-u="kg">${esc(g.name)} (${$d2(g.cost_kg||0)}/kg)</option>`).join('')||'<option>Sin stock de producción</option>';
  } else {
    s.innerHTML=S.ins.map(i=>`<option value="${i.id}" data-cu="${i.costUnit||0}" data-u="${i.unit}">${esc(i.name)} (${$d2(i.costUnit||0)}/${i.unit})</option>`).join('')||'<option>Sin insumos</option>';
  }
}

function renderLotItems(){
  onLiTipo(); // populate selector
  const list=document.getElementById('lot-items-list');
  if(!list)return;
  if(!lotItems.length){list.innerHTML='<div style="font-size:11px;color:var(--tx3);font-family:var(--mo);padding:4px 0">Sin ingredientes agregados</div>';return;}
  const costoTotal=lotItems.reduce((s,x)=>s+x.costo_total,0);
  list.innerHTML=lotItems.map((x,i)=>`
    <div class="pvi">
      <div>
        <div class="pvn">${esc(x.nombre)} <span class="tag ${x.tipo==='stock_prod'?'tp':'tc'}">${x.tipo==='stock_prod'?'stock prod':'insumo'}</span></div>
        <div class="pvd">${x.qty} ${x.unit} × ${$d2(x.costo_unit)} = ${$m(x.costo_total)}</div>
      </div>
      <button class="dbtn" onclick="rmLotItem(${i})">✕</button>
    </div>`).join('')
    +`<div style="text-align:right;font-size:12px;font-family:var(--mo);color:var(--ac);padding:6px 0;border-top:1px solid var(--br);margin-top:4px">Costo total: ${$m(costoTotal)}</div>`;
}

function addLotItem(){
  const tipo=document.getElementById('li-tipo')?.value;
  const sel=document.getElementById('li-item');
  const opt=sel?.options[sel.selectedIndex];
  const itemId=sel?.value;
  const qty=parseFloat(document.getElementById('li-qty')?.value)||0;
  if(!itemId||!qty)return alert('Seleccioná item y cantidad');
  const cu=parseFloat(opt?.dataset?.cu)||0;
  const unit=opt?.dataset?.u||'kg';
  let nombre='';
  if(tipo==='stock_prod'){const g=sgProd().find(x=>x.id===itemId);nombre=g?g.name:itemId;}
  else{const i=S.ins.find(x=>x.id===itemId);nombre=i?i.name:itemId;}
  lotItems.push({tipo,ref_id:itemId,nombre,qty,unit,costo_unit:cu,costo_total:qty*cu});
  document.getElementById('li-qty').value='';
  renderLotItems();
}
function rmLotItem(i){lotItems.splice(i,1);renderLotItems();}

async function saveLote(){
  const nom=document.getElementById('lot-n')?.value.trim();
  const note=document.getElementById('lot-note')?.value.trim();
  const outGid=document.getElementById('lot-outg')?.value;
  const outKg=parseFloat(document.getElementById('lot-outkg')?.value)||0;
  if(!nom)return alert('Ingresá un nombre para el lote');
  if(!lotItems.length)return alert('Agregá al menos un ingrediente');

  const costoTotal=lotItems.reduce((s,x)=>s+x.costo_total,0);
  const time=new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
  const loteId=uid();

  const lote={id:loteId,day,date:day,nombre:nom,output_group_id:outGid||null,output_kg:outKg,costo_total:costoTotal,note,time};
  const items=lotItems.map(x=>({id:uid(),produccion_id:loteId,tipo:x.tipo,ref_id:x.ref_id,nombre:x.nombre,qty:x.qty,unit:x.unit,costo_unit:x.costo_unit,costo_total:x.costo_total}));

  // descontar stock de producción
  lotItems.forEach(x=>{
    if(x.tipo==='stock_prod'){
      const g=S.sg.find(sg=>sg.id===x.ref_id);
      if(g)g.stock_kg=Math.max(0,(g.stock_kg||0)-x.qty);
    }
  });
  // agregar al stock de venta si corresponde
  if(outGid&&outKg>0){
    const og=S.sg.find(x=>x.id===outGid);
    if(og)og.stock_kg=(og.stock_kg||0)+outKg;
  }

  S.pr.push(lote);
  S.pri.push(...items);
  lotItems=[];
  save();render();

  if(online){
    sync('busy','guardando...');
    try{
      await sbUp('produccion',{id:lote.id,day:lote.day,nombre:lote.nombre,output_group_id:lote.output_group_id,output_kg:lote.output_kg,costo_total:lote.costo_total,note:lote.note,time:lote.time});
      if(items.length)await sbUp('produccion_items',items);
      // actualizar stocks
      const toUp=S.sg.filter(g=>lotItems.some(x=>x.ref_id===g.id)||(outGid&&g.id===outGid));
      for(const g of [...new Set(toUp)])await sbUp('stock_groups',{id:g.id,name:g.name,unit:g.unit,tipo:g.tipo,stock_kg:g.stock_kg,cost_kg:g.cost_kg||0});
      // también los que realmente cambiaron
      const changed=[...new Set([...lote.output_group_id?[lote.output_group_id]:[],...items.filter(x=>x.tipo==='stock_prod').map(x=>x.ref_id)])];
      for(const gid of changed){const g=S.sg.find(x=>x.id===gid);if(g)await sbUp('stock_groups',{id:g.id,name:g.name,unit:g.unit,tipo:g.tipo,stock_kg:g.stock_kg,cost_kg:g.cost_kg||0});}
      sync('ok','guardado');
    }catch(e){sync('err','error');console.error(e)}
  }
}
async function delLote(id){
  if(!confirm('¿Eliminar este lote?'))return;
  const lote=S.pr.find(x=>x.id===id);
  if(lote){
    // revertir stock
    const items=S.pri.filter(x=>x.produccion_id===id);
    items.forEach(x=>{if(x.tipo==='stock_prod'){const g=S.sg.find(sg=>sg.id===x.ref_id);if(g)g.stock_kg=(g.stock_kg||0)+x.qty;}});
    if(lote.output_group_id&&lote.output_kg){const og=S.sg.find(x=>x.id===lote.output_group_id);if(og)og.stock_kg=Math.max(0,(og.stock_kg||0)-lote.output_kg);}
  }
  S.pr=S.pr.filter(x=>x.id!==id);
  S.pri=S.pri.filter(x=>x.produccion_id!==id);
  save();render();
  if(online){try{await sbDel('produccion',id);}catch(e){}}
}

/* Insumos — visible dentro de Producción */
function rInsumosSection(){
  const rows=S.ins.length?S.ins.map(i=>`<tr><td>${esc(i.name)}</td><td><input type="number" class="ip" value="${i.costUnit||0}" onchange="updIns('${i.id}',this.value)"></td><td style="color:var(--tx3)">${i.unit}</td><td><button class="dbtn" onclick="delIns('${i.id}')">✕</button></td></tr>`).join(''):`<tr><td colspan="4" class="empty-row">Sin insumos</td></tr>`;
  return`
  <div class="sh">Insumos (harina, aceite, etc.)</div>
  <div class="blk"><div class="bt">Agregar insumo</div>
    <div class="fr"><div class="fl" style="flex:2"><label>Nombre</label><input type="text" id="ins-n" placeholder="Ej: Harina, Aceite, Huevo..."></div><div class="fl" style="max-width:75px"><label>Unidad</label><select id="ins-u"><option>kg</option><option>litro</option><option>unidad</option><option>bolsa</option><option>caja</option></select></div></div>
    <div class="fr"><div class="fl"><label>Costo por unidad $</label><input type="number" id="ins-c" placeholder="0"></div><button class="btn btnp" onclick="addIns()" style="align-self:flex-end">+ Agregar</button></div>
  </div>
  <div class="tbk"><div class="tt">Insumos — editá costo directo cuando suba</div>
    <table><thead><tr><th>Insumo</th><th>Costo $</th><th>Unidad</th><th></th></tr></thead><tbody>${rows}</tbody></table>
  </div>`;
}

async function addIns(){const n=document.getElementById('ins-n')?.value.trim(),u=document.getElementById('ins-u')?.value,c=parseFloat(document.getElementById('ins-c')?.value)||0;if(!n||!c)return alert('Completá nombre y costo');if(S.ins.find(i=>i.name===n))return alert('Ya existe');const row={id:uid(),name:n,unit:u,costUnit:c,cost_unit:c};S.ins.push(row);save();render();if(online){try{await sbUp('insumos',{id:row.id,name:row.name,unit:row.unit,cost_unit:row.costUnit});sync('ok','guardado')}catch(e){sync('err','error')}}}
async function updIns(id,v){const i=S.ins.find(x=>x.id===id);if(!i)return;i.costUnit=parseFloat(v)||0;i.cost_unit=i.costUnit;save();toast('Costo actualizado ✓');if(online){try{await sbUp('insumos',{id:i.id,name:i.name,unit:i.unit,cost_unit:i.costUnit});sync('ok','guardado')}catch(e){sync('err','error')}}}
async function delIns(id){S.ins=S.ins.filter(x=>x.id!==id);save();render();if(online){try{await sbDel('insumos',id)}catch(e){}}}

/* ══════════════════════════════════════════
   GASTOS
══════════════════════════════════════════ */
function rGastos(){
  const gs=dG(),tot=gs.reduce((s,g)=>s+g.amount,0);
  const cats={};gs.forEach(g=>{cats[g.cat]=(cats[g.cat]||0)+g.amount});
  const cH=Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--br)"><span style="font-size:11px;color:var(--tx2)">${c}</span><span style="font-family:var(--mo);font-size:12px">${$m(v)}</span></div>`).join('');
  const rows=gs.length?gs.map(g=>`<tr><td>${g.time||''}</td><td style="max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(g.descripcion)}</td><td><span class="tag tg">${(g.cat||'').slice(0,5)}</span></td><td>${$m(g.amount)}</td><td><button class="dbtn" onclick="delGa('${g.id}')">✕</button></td></tr>`).join(''):`<tr><td colspan="5" class="empty-row">Sin gastos</td></tr>`;
  return`<div class="kpis"><div class="kc hi"><div class="kl">Total gastos</div><div class="kv r">${$m(tot)}</div><div class="kh">${gs.length} registros</div></div></div>
  ${Object.keys(cats).length?`<div class="blk"><div class="bt">Por categoría</div>${cH}</div>`:''}
  <div class="blk"><div class="bt">Registrar gasto</div>
    <div class="fr"><div class="fl" style="flex:2"><label>Descripción</label><input type="text" id="g-d" placeholder="Ej: Proveedor, gas, bolsas..."></div><div class="fl"><label>Categoría</label><select id="g-c"><option>Materia prima</option><option>Servicios</option><option>Personal</option><option>Embalaje</option><option>Limpieza</option><option>Otros</option></select></div></div>
    <div class="fr"><div class="fl"><label>Monto $</label><input type="number" id="g-a" placeholder="0"></div><button class="btn btnp" onclick="addGa()" style="align-self:flex-end">+ Agregar</button></div>
  </div>
  <div class="tbk"><div class="tt">Gastos del día</div>
    <table><thead><tr><th>Hora</th><th>Descripción</th><th>Cat.</th><th>Monto</th><th></th></tr></thead><tbody>${rows}</tbody></table>
  </div>`;
}
async function addGa(){const d2=document.getElementById('g-d').value.trim(),c=document.getElementById('g-c').value,a=parseFloat(document.getElementById('g-a').value)||0;if(!d2||!a)return alert('Completá descripción y monto');const time=new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});const row={id:uid(),day,descripcion:d2,cat:c,amount:a,time};if(!S.ga[day])S.ga[day]=[];S.ga[day].push(row);save();render();if(online){sync('busy','guardando...');try{await sbUp('gastos',row);sync('ok','guardado')}catch(e){sync('err','error')}}}
async function delGa(id){S.ga[day]=(S.ga[day]||[]).filter(x=>x.id!==id);save();render();if(online){try{await sbDel('gastos',id)}catch(e){}}}

/* ══════════════════════════════════════════
   REPORTES — INFORME FINANCIERO COMPLETO
══════════════════════════════════════════ */
function getMths(){const s=new Set();Object.keys(S.ve).forEach(d=>s.add(d.slice(0,7)));return[...s].sort((a,b)=>b.localeCompare(a))}

function mData(ym){
  const vs=Object.entries(S.ve).filter(([d])=>d.startsWith(ym)).flatMap(([,v])=>v);
  const tv=vs.reduce((s,v)=>s+v.total,0);
  const byG={};
  vs.forEach(v=>{const g=S.sg.find(x=>x.id===v.group_id),gn=g?g.name:'Otros';if(!byG[gn])byG[gn]={kg:0,tot:0,cnt:0};byG[gn].kg+=(v.kg_total||0);byG[gn].tot+=v.total;byG[gn].cnt+=v.qty});
  const tg=Object.entries(S.ga).filter(([d])=>d.startsWith(ym)).flatMap(([,g])=>g).reduce((s,g)=>s+g.amount,0);
  // costos de produccion del mes
  const prMes=S.pr.filter(p=>(p.day||p.date||'').startsWith(ym));
  const costoProd=prMes.reduce((s,p)=>s+p.costo_total,0);
  return{vs,tv,tg,byG,costoProd,prMes};
}
function yrData(yr){const ms=[];for(let m=1;m<=12;m++){const ym=yr+'-'+m.toString().padStart(2,'0');const{tv,tg,costoProd}=mData(ym);ms.push({ym,lbl:fM(ym).split(' ')[0],tv,tg,cp:costoProd,res:tv-tg-costoProd})}return ms}

function rReportes(){
  const mths=getMths();
  if(!mths.includes(rMonth)&&mths.length)rMonth=mths[0];
  const yr=rMonth.split('-')[0];
  const tabs=mths.length?mths.map(m=>`<button class="mtab ${m===rMonth?'active':''}" onclick="setRM('${m}')">${fM(m)}</button>`).join(''):`<span style="font-size:10px;color:var(--tx3);font-family:var(--mo)">Sin datos aún</span>`;
  const{tv,tg,byG,costoProd,prMes}=mData(rMonth);

  // Rentabilidad
  const costoTotal=tg+costoProd;
  const ganancia=tv-costoTotal;
  const margen=tv>0?Math.round((ganancia/tv)*100):0;
  const margenCol=margen>30?'var(--gn)':margen>10?'var(--ac)':'var(--rd)';

  // Top grupos
  const bgRows=Object.entries(byG).sort((a,b)=>b[1].tot-a[1].tot).map(([n,d])=>`<tr>
    <td>${esc(n)}</td>
    <td style="font-family:var(--mo)">${kg(d.kg)}</td>
    <td style="font-family:var(--mo)">${$m(d.tot)}</td>
    <td style="font-family:var(--mo);color:${tv>0&&(d.tot/tv)>.3?'var(--gn)':'var(--tx3)'};">${Math.round(tv>0?(d.tot/tv)*100:0)}%</td>
  </tr>`).join('')||`<tr><td colspan="4" class="empty-row">Sin datos</td></tr>`;

  // Desglose costos producción del mes
  const prodCostRows=prMes.length?prMes.map(p=>`<tr>
    <td>${fD(p.day||p.date||'')}</td>
    <td>${esc(p.nombre)}</td>
    <td style="font-family:var(--mo)">${$m(p.costo_total||0)}</td>
    <td style="color:var(--tx3);font-size:10px">${esc(p.note||'')}</td>
  </tr>`).join(''):`<tr><td colspan="4" class="empty-row">Sin lotes</td></tr>`;

  // Resumen gastos por cat
  const catGas={};Object.entries(S.ga).filter(([d])=>d.startsWith(rMonth)).flatMap(([,g])=>g).forEach(g=>{catGas[g.cat]=(catGas[g.cat]||0)+g.amount});
  const catRows=Object.entries(catGas).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<tr><td>${c}</td><td style="font-family:var(--mo)">${$m(v)}</td><td style="font-family:var(--mo);color:var(--tx3)">${Math.round(tg>0?(v/tg)*100:0)}%</td></tr>`).join('')||`<tr><td colspan="3" class="empty-row">Sin gastos</td></tr>`;

  return`
  <div class="mtabs">${tabs}</div>

  <div class="sh">📊 Resumen financiero — ${fM(rMonth)}</div>
  <div class="kpis t3">
    <div class="kc hi"><div class="kl">Ingresos</div><div class="kv a">${$m(tv)}</div></div>
    <div class="kc"><div class="kl">Costos totales</div><div class="kv r">${$m(costoTotal)}</div></div>
    <div class="kc"><div class="kl">Ganancia</div><div class="kv ${ganancia>=0?'g':'r'}">${$m(ganancia)}</div></div>
  </div>
  <div class="kpis t3">
    <div class="kc"><div class="kl">Margen neto</div><div class="kv" style="color:${margenCol}">${margen}%</div></div>
    <div class="kc"><div class="kl">Costo producción</div><div class="kv r" style="font-size:15px">${$m(costoProd)}</div></div>
    <div class="kc"><div class="kl">Gastos operativos</div><div class="kv r" style="font-size:15px">${$m(tg)}</div></div>
  </div>

  <div class="blk">
    <div class="bt">Estructura de costos</div>
    <div style="margin-bottom:6px">
      ${costoTotal>0?[['Prod.',costoProd,'var(--bl)'],['Gastos',tg,'var(--or)']].map(([l,v,c])=>{const p=Math.round((v/costoTotal)*100);return`<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px"><span style="color:var(--tx2)">${l}</span><span style="font-family:var(--mo)">${$m(v)} (${p}%)</span></div><div class="sb-w"><div class="sb" style="width:${p}%;background:${c}"></div></div></div>`}).join(''):'<div style="font-size:11px;color:var(--tx3)">Sin datos</div>'}
    </div>
  </div>

  <div class="blk"><div class="bt">Ventas por día — ${fM(rMonth)}</div><div class="ch-w"><canvas id="cM"></canvas></div></div>

  <div class="tbk"><div class="tt">Ventas por grupo de stock</div>
    <table><thead><tr><th>Grupo</th><th>kg vendidos</th><th>Total $</th><th>% ventas</th></tr></thead><tbody>${bgRows}</tbody></table>
  </div>

  <div class="tbk"><div class="tt">Costos de producción del mes</div>
    <table><thead><tr><th>Fecha</th><th>Lote</th><th>Costo</th><th>Nota</th></tr></thead><tbody>${prodCostRows}</tbody></table>
  </div>

  <div class="tbk"><div class="tt">Gastos operativos por categoría</div>
    <table><thead><tr><th>Categoría</th><th>Monto</th><th>% gastos</th></tr></thead><tbody>${catRows}</tbody></table>
  </div>

  <div class="blk" style="margin-top:12px"><div class="bt">Ventas vs Costos anuales — ${yr}</div><div class="ch-w" style="height:150px"><canvas id="cA"></canvas></div></div>`;
}

function setRM(m){rMonth=m;go('reportes')}

function initCharts(){
  const ym=rMonth,yr=ym.split('-')[0];
  const[y2,mo]=ym.split('-').map(Number);const dc=new Date(y2,mo,0).getDate();
  const labs=[],dV=[],dC=[];
  for(let d=1;d<=dc;d++){
    const ds=ym+'-'+d.toString().padStart(2,'0');
    const v=(S.ve[ds]||[]).reduce((s,x)=>s+x.total,0);
    const g=(S.ga[ds]||[]).reduce((s,x)=>s+x.amount,0);
    const cp=S.pr.filter(p=>(p.day||p.date||'')===ds).reduce((s,p)=>s+p.costo_total,0);
    labs.push(d);dV.push(v);dC.push(g+cp);
  }
  const CHART_OPTS={responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#8a8680',font:{size:9,family:'DM Mono'}}}},scales:{x:{ticks:{color:'#4e4b48',font:{size:8}},grid:{color:'#252525'}},y:{ticks:{color:'#4e4b48',font:{size:9},callback:v=>'$'+Math.round(v).toLocaleString('es-AR')},grid:{color:'#252525'}}}};
  const cm=document.getElementById('cM');
  if(cm&&window.Chart){if(cM){try{cM.destroy()}catch(e){}}cM=new Chart(cm,{type:'bar',data:{labels:labs,datasets:[{label:'Ventas',data:dV,backgroundColor:'rgba(232,197,71,.7)',borderRadius:3},{label:'Costos',data:dC,backgroundColor:'rgba(248,113,113,.45)',borderRadius:3}]},options:CHART_OPTS});}
  const ca=document.getElementById('cA');
  if(ca&&window.Chart){if(cA){try{cA.destroy()}catch(e){}}const an=yrData(yr);cA=new Chart(ca,{type:'line',data:{labels:an.map(x=>x.lbl),datasets:[{label:'Ventas',data:an.map(x=>x.tv),borderColor:'rgba(232,197,71,.9)',backgroundColor:'rgba(232,197,71,.07)',tension:.3,fill:true,pointRadius:3,borderWidth:2},{label:'Costos',data:an.map(x=>x.tg+x.cp),borderColor:'rgba(248,113,113,.7)',backgroundColor:'transparent',tension:.3,pointRadius:3,borderWidth:1.5,borderDash:[4,3]}]},options:{...CHART_OPTS,scales:{...CHART_OPTS.scales}}});}
}

/* ── INIT ── */
sync('busy','cargando...');
loadAll().then(()=>{if(!online)sync('err','offline')});
render();

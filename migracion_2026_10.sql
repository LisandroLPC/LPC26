-- ══════════════════════════════════════════════════════════════
-- LPC — MIGRACIÓN OCTUBRE 2026 (v7)
-- Correr UNA vez en Supabase > SQL Editor, ANTES de subir la app nueva.
-- Es seguro correrla más de una vez: no duplica ni borra nada.
-- ══════════════════════════════════════════════════════════════
begin;

-- 1) Gastos del local (alquiler, luz, arreglos...): van al resultado, NO al cierre de caja
alter table gastos add column if not exists fuera_caja boolean default false;

-- 2) Cliente en cualquier venta (contado o Cta.Cte.)
alter table ventas add column if not exists cliente_id text;
-- las ventas de Cta.Cte. que ya existen quedan asignadas a su cliente
update ventas set cliente_id = cliente_cc_id where cliente_id is null and cliente_cc_id is not null;

-- 3) Costo cargado a mano: desde esa fecha arranca el promedio de lotes
alter table stock_groups add column if not exists cost_manual_at timestamptz;

-- 4) Precios especiales por cliente
create table if not exists cliente_precios (
  id text primary key,
  cliente_id text not null references clientes_cc(id) on delete cascade,
  variant_id text not null references stock_variants(id) on delete cascade,
  price numeric not null,
  updated_at timestamptz default now()
);
create unique index if not exists cliente_precios_cliente_variante on cliente_precios(cliente_id, variant_id);
alter table cliente_precios disable row level security;

-- 5) Detalle de billetes de los cierres: estaba guardado como texto, lo paso a objeto
update cierres set detalle = (detalle #>> '{}')::jsonb where jsonb_typeof(detalle) = 'string';

commit;

-- Control: tiene que devolver 4 filas con "ok"
select 'gastos.fuera_caja' as que, case when exists (select 1 from information_schema.columns where table_name='gastos' and column_name='fuera_caja') then 'ok' else 'FALTA' end as estado
union all select 'ventas.cliente_id', case when exists (select 1 from information_schema.columns where table_name='ventas' and column_name='cliente_id') then 'ok' else 'FALTA' end
union all select 'stock_groups.cost_manual_at', case when exists (select 1 from information_schema.columns where table_name='stock_groups' and column_name='cost_manual_at') then 'ok' else 'FALTA' end
union all select 'tabla cliente_precios', case when exists (select 1 from information_schema.tables where table_name='cliente_precios') then 'ok' else 'FALTA' end;


-- ══════════════════════════════════════════════════════════════
-- OPCIONAL (decidilo vos): pasar el alquiler del 12/08 a "gasto del local".
-- Ese día se cargó en efectivo desde la caja, pero la plata no salió del cajón
-- (por eso el cierre dio +$205.801). Si lo corrés, ese cierre queda bien.
-- No cambia el resultado del mes: sigue contando como gasto.
-- Para usarlo, sacale los dos guiones del principio y corrélo solo.
-- ══════════════════════════════════════════════════════════════
-- update gastos set fuera_caja = true where id = 'mstacr3m14m';

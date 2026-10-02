-- ══════════════════════════════════════════════════════════════
-- LPC — MIGRACIÓN v8.2: RETIROS EN MERCADERÍA (consumo personal)
-- Correr UNA vez en Supabase > SQL Editor, ANTES de subir la app nueva.
-- Es seguro correrla más de una vez: no duplica ni borra nada.
-- ══════════════════════════════════════════════════════════════
begin;

create table if not exists retiros_stock (
  id text primary key,
  day date not null,
  group_id text references stock_groups(id) on delete set null,
  variant_id text references stock_variants(id) on delete set null,
  nombre text not null,
  qty numeric not null,            -- cantidad en la unidad de la variante
  stock_used numeric not null,     -- lo que bajó del stock (kg/unidad del grupo)
  unit text default 'kg',
  costo_unit numeric default 0,    -- costo promedio del grupo en el momento del retiro
  costo_total numeric default 0,
  valor_venta numeric default 0,   -- lo que hubiera valido vendido a precio de lista
  motivo text default 'consumo_personal',
  note text,
  usuario text,
  time text,
  created_at timestamptz default now()
);
create index if not exists retiros_stock_day on retiros_stock(day);

-- Igual que el resto de las tablas HOY (después lo cerramos con el plan de seguridad)
alter table retiros_stock disable row level security;

commit;

-- Control: tiene que devolver "ok"
select case when exists (select 1 from information_schema.tables where table_name='retiros_stock') then 'ok' else 'FALTA' end as retiros_stock;

-- EJECUTAR EN SUPABASE SQL EDITOR (reemplaza todo)
drop table if exists ventas cascade;
drop table if exists gastos cascade;
drop table if exists produccion cascade;
drop table if exists produccion_items cascade;
drop table if exists products cascade;
drop table if exists stock_groups cascade;
drop table if exists stock_variants cascade;
drop table if exists insumos cascade;
drop table if exists recetas cascade;

create table stock_groups (
  id text primary key,
  name text not null,
  unit text default 'kg',
  stock_kg numeric default 0,
  tipo text default 'venta',
  cost_kg numeric default 0,
  updated_at timestamptz default now()
);

create table stock_variants (
  id text primary key,
  group_id text references stock_groups(id) on delete cascade,
  name text not null,
  kg_per_unit numeric not null default 1,
  price numeric default 0,
  updated_at timestamptz default now()
);

create table ventas (
  id text primary key,
  day date not null,
  variant_id text,
  group_id text,
  qty numeric not null,
  kg_total numeric not null,
  price_unit numeric not null,
  total numeric not null,
  pago text not null,
  time text,
  created_at timestamptz default now()
);

create table produccion (
  id text primary key,
  day date not null,
  nombre text not null,
  output_group_id text,
  output_kg numeric default 0,
  costo_total numeric default 0,
  note text,
  time text,
  created_at timestamptz default now()
);

create table produccion_items (
  id text primary key,
  produccion_id text references produccion(id) on delete cascade,
  tipo text not null,
  ref_id text not null,
  nombre text not null,
  qty numeric not null,
  unit text,
  costo_unit numeric default 0,
  costo_total numeric default 0,
  created_at timestamptz default now()
);

create table gastos (
  id text primary key,
  day date not null,
  descripcion text not null,
  cat text not null,
  amount numeric not null,
  time text,
  created_at timestamptz default now()
);

create table insumos (
  id text primary key,
  name text not null,
  unit text not null,
  cost_unit numeric default 0,
  updated_at timestamptz default now()
);

alter table stock_groups disable row level security;
alter table stock_variants disable row level security;
alter table ventas disable row level security;
alter table produccion disable row level security;
alter table produccion_items disable row level security;
alter table gastos disable row level security;
alter table insumos disable row level security;

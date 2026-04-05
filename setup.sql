-- ══════════════════════════════════════════════
-- LOS POLLOS CUÑADOS v5 — setup.sql
-- Ejecutar en Supabase SQL Editor
-- ══════════════════════════════════════════════

drop table if exists produccion_items cascade;
drop table if exists produccion cascade;
drop table if exists compras_items cascade;
drop table if exists compras cascade;
drop table if exists caja_movimientos cascade;
drop table if exists ventas cascade;
drop table if exists stock_variants cascade;
drop table if exists stock_groups cascade;
drop table if exists gastos cascade;
drop table if exists insumos cascade;
drop table if exists usuarios cascade;

-- USUARIOS
create table usuarios (
  id text primary key,
  nombre text not null,
  pin text not null,
  rol text not null default 'empleado',
  activo boolean default true,
  created_at timestamptz default now()
);

-- GRUPOS DE STOCK
-- tipo: 'venta' | 'produccion'
-- cost_unit: costo por unidad (se actualiza desde compras)
create table stock_groups (
  id text primary key,
  name text not null,
  unit text default 'kg',
  stock_qty numeric default 0,
  tipo text default 'venta',
  cost_unit numeric default 0,
  updated_at timestamptz default now()
);

-- VARIANTES DE VENTA
create table stock_variants (
  id text primary key,
  group_id text references stock_groups(id) on delete cascade,
  name text not null,
  qty_per_unit numeric not null default 1,
  price numeric default 0,
  updated_at timestamptz default now()
);

-- VENTAS
create table ventas (
  id text primary key,
  day date not null,
  variant_id text,
  group_id text,
  qty numeric not null,
  stock_used numeric not null,
  price_unit numeric not null,
  descuento_pct numeric default 0,
  total numeric not null,
  pago text not null,
  time text,
  created_at timestamptz default now()
);

-- MOVIMIENTOS DE CAJA (ingresos/egresos que no son ventas)
create table caja_movimientos (
  id text primary key,
  day date not null,
  tipo text not null,
  descripcion text not null,
  metodo text not null,
  monto numeric not null,
  time text,
  created_at timestamptz default now()
);

-- COMPRAS / FACTURAS
create table compras (
  id text primary key,
  day date not null,
  proveedor text not null,
  nro_factura text,
  total numeric not null,
  pago_efectivo numeric default 0,
  pago_transferencia numeric default 0,
  note text,
  time text,
  created_at timestamptz default now()
);

-- ITEMS DE CADA FACTURA
create table compras_items (
  id text primary key,
  compra_id text references compras(id) on delete cascade,
  descripcion text not null,
  tipo_destino text not null,
  ref_id text,
  qty_compra numeric not null,
  unit_compra text,
  qty_real numeric,
  unit_real text,
  precio_total numeric not null,
  cost_unit_calculado numeric,
  created_at timestamptz default now()
);

-- PRODUCCION — CORTE (ingresa stock, sin costo extra)
create table cortes (
  id text primary key,
  day date not null,
  nombre text not null,
  note text,
  time text,
  created_at timestamptz default now()
);

create table cortes_items (
  id text primary key,
  corte_id text references cortes(id) on delete cascade,
  group_id text,
  nombre text not null,
  qty numeric not null,
  unit text,
  created_at timestamptz default now()
);

-- PRODUCCION — ELABORACION (consume stock, costo solo informativo)
create table elaboraciones (
  id text primary key,
  day date not null,
  nombre text not null,
  output_group_id text,
  output_qty numeric default 0,
  costo_total_info numeric default 0,
  note text,
  time text,
  created_at timestamptz default now()
);

create table elaboraciones_items (
  id text primary key,
  elaboracion_id text references elaboraciones(id) on delete cascade,
  tipo text not null,
  ref_id text not null,
  nombre text not null,
  qty numeric not null,
  unit text,
  costo_unit numeric default 0,
  costo_subtotal numeric default 0,
  created_at timestamptz default now()
);

-- GASTOS OPERATIVOS
create table gastos (
  id text primary key,
  day date not null,
  descripcion text not null,
  cat text not null,
  amount numeric not null,
  time text,
  created_at timestamptz default now()
);

-- INSUMOS
create table insumos (
  id text primary key,
  name text not null,
  unit text not null,
  cost_unit numeric default 0,
  updated_at timestamptz default now()
);

-- SIN RLS
alter table usuarios disable row level security;
alter table stock_groups disable row level security;
alter table stock_variants disable row level security;
alter table ventas disable row level security;
alter table caja_movimientos disable row level security;
alter table compras disable row level security;
alter table compras_items disable row level security;
alter table cortes disable row level security;
alter table cortes_items disable row level security;
alter table elaboraciones disable row level security;
alter table elaboraciones_items disable row level security;
alter table gastos disable row level security;
alter table insumos disable row level security;

-- USUARIOS DEFAULT
insert into usuarios (id, nombre, pin, rol) values
  ('usr_dueno', 'Dueño', '1234', 'dueno'),
  ('usr_empleado', 'Empleado', '0000', 'empleado');

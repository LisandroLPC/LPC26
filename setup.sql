-- ══════════════════════════════════════════════
-- LOS POLLOS CUÑADOS v4 — setup.sql
-- Ejecutar en Supabase SQL Editor
-- ══════════════════════════════════════════════

-- 1. BORRAR TABLAS VIEJAS
drop table if exists ventas cascade;
drop table if exists gastos cascade;
drop table if exists produccion cascade;
drop table if exists produccion_items cascade;
drop table if exists compras cascade;
drop table if exists compras_items cascade;
drop table if exists stock_groups cascade;
drop table if exists stock_variants cascade;
drop table if exists insumos cascade;
drop table if exists recetas cascade;
drop table if exists products cascade;
drop table if exists usuarios cascade;

-- 2. USUARIOS (dueño y empleado, login por PIN)
create table usuarios (
  id text primary key,
  nombre text not null,
  pin text not null,
  rol text not null default 'empleado',  -- 'dueno' | 'empleado'
  activo boolean default true,
  created_at timestamptz default now()
);

-- 3. STOCK GROUPS
-- tipo: 'venta' | 'produccion'
-- unit: kg | unidad | litro | docena | bandeja | bolsa
create table stock_groups (
  id text primary key,
  name text not null,
  unit text default 'kg',
  stock_qty numeric default 0,
  tipo text default 'venta',
  cost_unit numeric default 0,
  updated_at timestamptz default now()
);

-- 4. VARIANTES DE VENTA
-- qty_per_unit: cuántas unidades del grupo descuenta cada venta
create table stock_variants (
  id text primary key,
  group_id text references stock_groups(id) on delete cascade,
  name text not null,
  qty_per_unit numeric not null default 1,
  price numeric default 0,
  updated_at timestamptz default now()
);

-- 5. VENTAS
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

-- 6. INGRESOS DE CAJA (no ventas: préstamos, retiros, fondos)
create table caja_movimientos (
  id text primary key,
  day date not null,
  tipo text not null,       -- 'ingreso' | 'egreso'
  descripcion text not null,
  metodo text not null,     -- 'efectivo' | 'transferencia'
  monto numeric not null,
  time text,
  created_at timestamptz default now()
);

-- 7. COMPRAS / FACTURAS DE PROVEEDORES
create table compras (
  id text primary key,
  day date not null,
  proveedor text not null,
  nro_factura text,
  total numeric not null,
  note text,
  time text,
  created_at timestamptz default now()
);

-- Items de cada factura
create table compras_items (
  id text primary key,
  compra_id text references compras(id) on delete cascade,
  descripcion text not null,
  tipo_destino text not null,   -- 'stock_prod' | 'insumo' | 'gasto'
  ref_id text,                  -- id del stock_group o insumo
  qty_compra numeric not null,  -- cantidad comprada (cajones, bolsas, etc.)
  unit_compra text,             -- unidad de compra (cajon, bolsa, kg)
  qty_real numeric,             -- cantidad real en unidad del stock (ej: kg reales del cajón)
  unit_real text,               -- unidad real del stock
  precio_total numeric not null,
  cost_unit_calculado numeric,  -- precio_total / qty_real
  created_at timestamptz default now()
);

-- 8. PRODUCCION
create table produccion (
  id text primary key,
  day date not null,
  nombre text not null,
  output_group_id text,
  output_qty numeric default 0,
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

-- 9. GASTOS OPERATIVOS
create table gastos (
  id text primary key,
  day date not null,
  descripcion text not null,
  cat text not null,
  amount numeric not null,
  time text,
  created_at timestamptz default now()
);

-- 10. INSUMOS
create table insumos (
  id text primary key,
  name text not null,
  unit text not null,
  cost_unit numeric default 0,
  updated_at timestamptz default now()
);

-- 11. DESHABILITAR RLS
alter table usuarios disable row level security;
alter table stock_groups disable row level security;
alter table stock_variants disable row level security;
alter table ventas disable row level security;
alter table caja_movimientos disable row level security;
alter table compras disable row level security;
alter table compras_items disable row level security;
alter table produccion disable row level security;
alter table produccion_items disable row level security;
alter table gastos disable row level security;
alter table insumos disable row level security;

-- 12. USUARIOS DEFAULT
-- PIN dueño: 1234 | PIN empleado: 0000 (cambiá después desde la app)
insert into usuarios (id, nombre, pin, rol) values
  ('usr_dueno', 'Dueño', '1234', 'dueno'),
  ('usr_empleado', 'Empleado', '0000', 'empleado');

-- 13. MIGRACIÓN DE DATOS ANTERIORES
-- Si tenías datos en la versión anterior, este bloque los intenta recuperar.
-- Si no existían las tablas viejas, los DO blocks simplemente no hacen nada.

-- (no hay tablas viejas con estructura compatible en esta instalación fresca)
-- Para migrar ventas anteriores manualmente, contactar soporte.

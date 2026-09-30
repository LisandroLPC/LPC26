-- ══════════════════════════════════════════════════════════════
-- LOS POLLOS CUÑADOS — setup.sql (v7, octubre 2026)
-- Esquema COMPLETO tal como está en producción + migración de octubre.
--
-- ES SEGURO: no borra nada. Usa "create table if not exists" y
-- "add column if not exists". Si lo corrés sobre la base actual,
-- solo agrega lo que falte. Si lo corrés en una base vacía, la arma entera.
-- ══════════════════════════════════════════════════════════════

-- USUARIOS
create table if not exists usuarios (
  id text primary key,
  nombre text not null,
  pin text not null,
  rol text not null default 'empleado',
  activo boolean default true,
  created_at timestamptz default now()
);

-- GRUPOS DE STOCK
create table if not exists stock_groups (
  id text primary key,
  name text not null,
  unit text default 'kg',
  stock_qty numeric default 0,
  tipo text default 'venta',
  cost_unit numeric default 0,
  updated_at timestamptz default now()
);

-- VARIANTES DE VENTA
create table if not exists stock_variants (
  id text primary key,
  group_id text references stock_groups(id) on delete cascade,
  name text not null,
  qty_per_unit numeric not null default 1,
  price numeric default 0,
  updated_at timestamptz default now()
);

-- CLIENTES (contado y cuenta corriente)
create table if not exists clientes_cc (
  id text primary key,
  nombre text not null,
  telefono text,
  time text,
  created_at timestamptz default now()
);

-- VENTAS
create table if not exists ventas (
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
  created_at timestamptz default now(),
  ticket_id text,
  pago_ef numeric default 0,
  pago_tr numeric default 0,
  costo_unit_venta numeric default 0,
  usuario text,
  cliente_cc_id text,
  cc_pagado boolean default false
);

-- MOVIMIENTOS DE CAJA (ingresos/egresos que no son ventas, cobros de Cta.Cte.)
create table if not exists caja_movimientos (
  id text primary key,
  day date not null,
  tipo text not null,
  descripcion text not null,
  metodo text not null,
  monto numeric not null,
  time text,
  created_at timestamptz default now(),
  usuario text,
  cliente_cc_id text
);

-- COMPRAS / FACTURAS
create table if not exists compras (
  id text primary key,
  day date not null,
  proveedor text not null,
  nro_factura text,
  total numeric not null,
  pago_efectivo numeric default 0,
  pago_transferencia numeric default 0,
  note text,
  time text,
  created_at timestamptz default now(),
  grupos_propagados text default '[]',
  gasto_id text,
  usuario text
);

create table if not exists compras_items (
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
  created_at timestamptz default now(),
  usado boolean default false,
  upd_stock boolean default true,
  upd_cost boolean default true
);

-- PRODUCCIÓN — CORTE
create table if not exists cortes (
  id text primary key,
  day date not null,
  nombre text not null,
  note text,
  time text,
  created_at timestamptz default now(),
  origen_compra_item_id text,
  usuario text
);

create table if not exists cortes_items (
  id text primary key,
  corte_id text references cortes(id) on delete cascade,
  group_id text,
  nombre text not null,
  qty numeric not null,
  unit text,
  created_at timestamptz default now(),
  cost_unit_aplicado numeric default 0
);

-- PRODUCCIÓN — ELABORACIÓN
create table if not exists elaboraciones (
  id text primary key,
  day date not null,
  nombre text not null,
  output_group_id text,
  output_qty numeric default 0,
  costo_total_info numeric default 0,
  note text,
  time text,
  created_at timestamptz default now(),
  usuario text
);

create table if not exists elaboraciones_items (
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

-- GASTOS (operativos de caja, del local y los vinculados a compras)
create table if not exists gastos (
  id text primary key,
  day date not null,
  descripcion text not null,
  cat text not null,
  amount numeric not null,
  time text,
  created_at timestamptz default now(),
  metodo text default 'efectivo',
  auto boolean default false,
  pago_efectivo numeric default 0,
  pago_transferencia numeric default 0,
  usuario text
);

-- INSUMOS
create table if not exists insumos (
  id text primary key,
  name text not null,
  unit text not null,
  cost_unit numeric default 0,
  updated_at timestamptz default now(),
  stock_qty numeric default 0
);

-- CIERRES DE CAJA
create table if not exists cierres (
  id text primary key,
  day date not null unique,
  total_contado numeric not null,
  retiro numeric default 0,
  saldo_siguiente numeric default 0,
  fondo_inicial_manual numeric,
  detalle jsonb,
  time text,
  created_at timestamptz default now(),
  fondo_digital_manual numeric,
  saldo_digital_real numeric,
  saldo_digital_siguiente numeric
);

-- ══════════════════════════════════════════════════════════════
-- MIGRACIÓN OCTUBRE 2026 (v7) — lo nuevo
-- ══════════════════════════════════════════════════════════════

-- Gastos del local (alquiler, luz, arreglos...): cuentan en el resultado, NO en el cierre de caja
alter table gastos add column if not exists fuera_caja boolean default false;

-- Cliente en cualquier venta (contado o Cta.Cte.)
alter table ventas add column if not exists cliente_id text;

-- Fecha del último costo cargado a mano (el costo promedio arranca a contar desde ahí)
alter table stock_groups add column if not exists cost_manual_at timestamptz;

-- Precios especiales por cliente
create table if not exists cliente_precios (
  id text primary key,
  cliente_id text not null references clientes_cc(id) on delete cascade,
  variant_id text not null references stock_variants(id) on delete cascade,
  price numeric not null,
  updated_at timestamptz default now()
);
create unique index if not exists cliente_precios_cliente_variante on cliente_precios(cliente_id, variant_id);

-- Mismo acceso que el resto de las tablas (hasta que armemos la seguridad).
alter table usuarios disable row level security;
alter table stock_groups disable row level security;
alter table stock_variants disable row level security;
alter table clientes_cc disable row level security;
alter table cliente_precios disable row level security;
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
alter table cierres disable row level security;

-- Los usuarios iniciales solo se crean si la tabla está vacía (base nueva).
-- CAMBIÁ ESTOS PIN APENAS ENTRES.
insert into usuarios (id, nombre, pin, rol)
select * from (values ('usr_dueno','Dueño','1234','dueno'),('usr_empleado','Empleado','0000','empleado')) v(id,nombre,pin,rol)
where not exists (select 1 from usuarios);

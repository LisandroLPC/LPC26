-- ══════════════════════════════════════════════════════════════
-- LPC — SEGURIDAD ETAPA 1: solo dispositivos con sesión pueden leer/escribir
-- Correr RECIÉN cuando los 3 dispositivos (PC local, PC casa, celular)
-- ya hayan iniciado sesión con la app v9.0. Si no, quedan bloqueados.
-- ══════════════════════════════════════════════════════════════
begin;
do $$
declare t text;
begin
  foreach t in array array['usuarios','stock_groups','stock_variants','insumos','clientes_cc','cliente_precios',
    'ventas','caja_movimientos','compras','compras_items','cortes','cortes_items','elaboraciones',
    'elaboraciones_items','gastos','cierres','retiros_stock']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists solo_local on public.%I', t);
    execute format('create policy solo_local on public.%I for all to authenticated using (true) with check (true)', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;
commit;

-- Control: tiene que dar 17 filas con rls = true y anon_puede = false
select c.relname tabla, c.relrowsecurity rls, has_table_privilege('anon', c.oid, 'select') anon_puede
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r' order by 1;

-- ══════════════════════════════════════════════════════════════
-- MARCHA ATRÁS (solo si algo sale mal): deja todo como estaba antes
-- ══════════════════════════════════════════════════════════════
-- do $$ declare t text; begin
--   foreach t in array array['usuarios','stock_groups','stock_variants','insumos','clientes_cc','cliente_precios','ventas','caja_movimientos','compras','compras_items','cortes','cortes_items','elaboraciones','elaboraciones_items','gastos','cierres','retiros_stock']
--   loop
--     execute format('alter table public.%I disable row level security', t);
--     execute format('grant all on public.%I to anon', t);
--   end loop;
-- end $$;

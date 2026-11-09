-- KONYS PIZZA: reemplazo manual y acotado de los ocho platos DEMO originales.
-- NO EJECUTADO por el asistente. Revisar antes de ejecutar en el SQL Editor.
--
-- v_demo_allowlist contiene exactamente las ocho filas DEMO que el propietario
-- consultó en Supabase y proporcionó el 2026-11-08, incluidos sus UUID reales.
-- El script compara TODOS sus valores antes de realizar el reemplazo.
-- Consulta opcional para revisar el estado actual antes de ejecutar:
-- SELECT id, nombre, categoria, descripcion, precio, disponible
-- FROM public.platos ORDER BY nombre;
-- No ampliar esta lista para incluir otros platos ni actualizarla para forzar
-- el reemplazo de un demo que el administrador haya editado después.
-- Conservar la lista y los UUID nuevos al volver a ejecutar el archivo.
--
-- Los UUID de v_new_products son NUEVOS, generados exclusivamente para este
-- reemplazo. No se han supuesto ni reutilizado identificadores de demos.
-- Precios de referencia proporcionados por el usuario desde Rappi:
-- https://www.rappi.com.co/restaurantes/900369200-konys-pizza
-- No son precios confirmados para consumo en el restaurante.
--
-- Garantías: transacción única; identificación por ID + huella completa;
-- si un demo fue editado/ocultado, aborta sin borrar nada; si un producto real
-- ya usa un nombre nuevo, aborta sin sobrescribirlo. Una segunda ejecución
-- completa no cambia precios, visibilidad ni ediciones posteriores del admin.
-- No modifica esquema, RLS, autenticación, funciones ni otras tablas.

begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $reemplazar_carta$
declare
  -- Únicos registros autorizados para el reemplazo; valores entregados por el propietario.
  v_demo_allowlist jsonb := $demos$[
    {"id":"dd398708-475d-4dbe-8af1-2904dfa3e84a","nombre":"DEMO - Brownie","categoria":"postres","descripcion":"Postre de demostración","precio":12000,"disponible":true},
    {"id":"22d8a7ad-9a03-4ece-9919-6c5bf0a7cc7c","nombre":"DEMO - Gaseosa","categoria":"bebidas","descripcion":"Bebida de demostración","precio":6000,"disponible":true},
    {"id":"bc40fcb8-923b-49fa-8025-92e43d2f2c11","nombre":"DEMO - Limonada","categoria":"bebidas","descripcion":"Bebida de demostración","precio":8000,"disponible":true},
    {"id":"2fd3a99b-b6c9-4f00-911a-3183c711740b","nombre":"DEMO - Pan de ajo","categoria":"entradas","descripcion":"Entrada de demostración","precio":12000,"disponible":true},
    {"id":"fd950b90-90fd-4244-a260-66722d1d5810","nombre":"DEMO - Pizza especial","categoria":"pizzas","descripcion":"Pizza de demostración","precio":35000,"disponible":true},
    {"id":"c8a9fac1-e2ac-4f92-aed1-f5c02d7b7343","nombre":"DEMO - Pizza hawaiana","categoria":"pizzas","descripcion":"Pizza con piña y jamón","precio":32000,"disponible":true},
    {"id":"cc94aff9-0f2b-4b0f-9275-a814ffb67943","nombre":"DEMO - Pizza margarita","categoria":"pizzas","descripcion":"Pizza con queso y tomate","precio":28000,"disponible":true},
    {"id":"a73c7388-09be-470f-b67d-dd809e477687","nombre":"DEMO - Pizza pepperoni","categoria":"pizzas","descripcion":"Pizza con pepperoni","precio":34000,"disponible":true}
  ]$demos$::jsonb;

  v_new_products jsonb := $productos$[
    {"id":"f95d8581-9cc3-4f1c-b175-d27a6c75c227","nombre":"Konys Bucara","categoria":"pizzas","descripcion":"Pizza en cono con carne Angus, mozzarella y mermelada de tocineta ahumada con ron y miel.","precio":30900,"disponible":true},
    {"id":"ab86c3a7-9490-47f1-b7c0-6807e592176f","nombre":"Pizza Marinera","categoria":"pizzas","descripcion":"Pizza en cono con camarón, pulpo, palmito, salsa especial y mozzarella.","precio":32900,"disponible":true},
    {"id":"dc3f8019-8909-4ec0-85c9-8469a5f969a2","nombre":"Pizza Mar y Tierra","categoria":"pizzas","descripcion":"Pizza en cono con camarón, pollo, pimentón, maíz y mozzarella.","precio":31900,"disponible":true},
    {"id":"cbb7f52e-157f-4033-bd50-132792b92aad","nombre":"Pizza Hawaiana","categoria":"pizzas","descripcion":"Pizza en cono con tocineta, jamón ahumado, piña y mozzarella.","precio":28900,"disponible":true},
    {"id":"36619b7a-5604-4c75-94d2-c8497fa35aa1","nombre":"Pizza Mexicana","categoria":"pizzas","descripcion":"Pizza en cono con carne molida, maíz, pimentón, cebolla, picante y mozzarella.","precio":28900,"disponible":true},
    {"id":"c1ef9432-14a7-41ec-9fe7-884c7a94ea4c","nombre":"Pizza Especial","categoria":"pizzas","descripcion":"Pizza en cono con pollo, tocineta, jamón, champiñones y mozzarella.","precio":30900,"disponible":true},
    {"id":"331f5da8-cace-48d0-af00-e759fe94b315","nombre":"Pizza Chicken","categoria":"pizzas","descripcion":"Pizza en cono con pollo, maíz, salsa napolitana y mozzarella.","precio":29900,"disponible":true},
    {"id":"1e5327a4-16a3-4463-a884-e136a4a8a321","nombre":"Pizza BBQ","categoria":"pizzas","descripcion":"Pizza en cono con pollo en salsa BBQ, cebolla caramelizada y mozzarella.","precio":29900,"disponible":true}
  ]$productos$::jsonb;
  v_demo_count integer;
  v_new_count integer;
  v_matched_count integer;
  v_changed_count integer;
begin
  if jsonb_typeof(v_demo_allowlist) is distinct from 'array' then
    raise exception 'Allowlist inválida: debe ser un arreglo JSON de ocho demos verificados.';
  end if;
  if jsonb_array_length(v_demo_allowlist) <> 8 then
    raise exception 'Lista DEMO alterada: se requieren exactamente los ocho registros autorizados. No se modificó la carta.';
  end if;
  if exists (
    select 1 from jsonb_array_elements(v_demo_allowlist) as item(value)
    where jsonb_typeof(value) is distinct from 'object'
       or not (value ?& array['id','nombre','categoria','descripcion','precio','disponible'])
       or jsonb_typeof(value->'id') is distinct from 'string'
       or jsonb_typeof(value->'nombre') is distinct from 'string'
       or jsonb_typeof(value->'categoria') is distinct from 'string'
       or jsonb_typeof(value->'descripcion') not in ('string','null')
       or jsonb_typeof(value->'precio') is distinct from 'number'
       or jsonb_typeof(value->'disponible') is distinct from 'boolean'
  ) or (select count(distinct value->>'id') from jsonb_array_elements(v_demo_allowlist)) <> 8 then
    raise exception 'Allowlist inválida: se requieren ocho IDs distintos y su huella completa, incluida la disponibilidad original.';
  end if;
  if exists (
    select 1 from jsonb_array_elements(v_demo_allowlist) as old_item(value)
    join jsonb_array_elements(v_new_products) as new_item(value)
      on old_item.value->>'id' = new_item.value->>'id'
  ) then
    raise exception 'Los IDs de los demos deben ser diferentes de los ocho UUID nuevos.';
  end if;

  -- Serializa este reemplazo y evita cambios concurrentes entre validación y DML.
  lock table public.platos in share row exclusive mode;

  select count(*) into v_demo_count
  from public.platos p
  join jsonb_populate_recordset(null::public.platos, v_demo_allowlist) d on d.id = p.id;
  select count(*) into v_new_count
  from public.platos p
  join jsonb_populate_recordset(null::public.platos, v_new_products) n on n.id = p.id;

  if v_demo_count = 0 and v_new_count = 8 then
    raise notice 'El reemplazo ya se realizó. Se conservan todas las ediciones y estados actuales de los ocho productos nuevos.';
    return;
  end if;
  if v_demo_count <> 8 or v_new_count <> 0 then
    raise exception 'Estado inesperado: % demos presentes y % IDs nuevos presentes. Revisa manualmente; no se borró ni insertó ningún plato.', v_demo_count, v_new_count;
  end if;

  select count(*) into v_matched_count
  from public.platos p
  join jsonb_populate_recordset(null::public.platos, v_demo_allowlist) d on d.id = p.id
  where p.nombre is not distinct from d.nombre
    and p.categoria is not distinct from d.categoria
    and p.descripcion is not distinct from d.descripcion
    and p.precio is not distinct from d.precio
    and p.disponible is not distinct from d.disponible;
  if v_matched_count <> 8 then
    raise exception 'Al menos un demo cambió desde su carga original. Se preservan las ediciones del administrador y se cancela todo el reemplazo.';
  end if;

  if exists (
    select 1 from public.platos p
    join jsonb_populate_recordset(null::public.platos, v_new_products) n
      on lower(btrim(p.nombre)) = lower(btrim(n.nombre))
    where not exists (
      select 1 from jsonb_populate_recordset(null::public.platos, v_demo_allowlist) d where d.id = p.id
    )
  ) then
    raise exception 'Ya existe un plato ajeno a los demos con un nombre de la nueva carta. Se cancela todo para evitar duplicados y preservar ese producto.';
  end if;

  delete from public.platos p
  using jsonb_populate_recordset(null::public.platos, v_demo_allowlist) d
  where p.id = d.id
    and p.nombre is not distinct from d.nombre
    and p.categoria is not distinct from d.categoria
    and p.descripcion is not distinct from d.descripcion
    and p.precio is not distinct from d.precio
    and p.disponible is not distinct from d.disponible;
  get diagnostics v_changed_count = row_count;
  if v_changed_count <> 8 then
    raise exception 'Se esperaban ocho demos eliminados, se obtuvieron %. Se revierte la transacción.', v_changed_count;
  end if;

  insert into public.platos (id, nombre, categoria, descripcion, precio, disponible)
  select n.id, n.nombre, n.categoria, n.descripcion, n.precio, true
  from jsonb_populate_recordset(null::public.platos, v_new_products) n;
  get diagnostics v_changed_count = row_count;
  if v_changed_count <> 8 then
    raise exception 'Se esperaban ocho productos insertados, se obtuvieron %. Se revierte la transacción.', v_changed_count;
  end if;
  raise notice 'Se reemplazaron exactamente ocho demos por ocho productos disponibles. El resto de la carta se conservó.';
end;
$reemplazar_carta$;

commit;

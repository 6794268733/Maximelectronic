-- Pegar completo en Supabase > SQL Editor > Run (se puede correr más de una vez)

create table if not exists productos (
  sku text primary key,                 -- número de referencia del producto
  nombre text not null, categoria text, subcategoria text, marca text,
  descripcion text, especificaciones text,
  precio_lista numeric, precio_final numeric not null,
  stock integer not null default 0 check (stock >= 0),
  imagen text, imagenes jsonb default '[]', colores jsonb default '[]', almacenamiento jsonb default '[]',
  destacado boolean default false, oferta boolean default false, etiqueta text,
  actualizado timestamptz default now()
);
-- Precio en dólares y medidas del paquete (para cotizar el envío)
alter table productos add column if not exists precio_usd numeric;
alter table productos add column if not exists peso_g integer;      -- peso del producto YA EMBALADO, en gramos
alter table productos add column if not exists alto_cm integer;
alter table productos add column if not exists ancho_cm integer;
alter table productos add column if not exists largo_cm integer;
alter table productos enable row level security;
drop policy if exists "catalogo publico" on productos;
create policy "catalogo publico" on productos for select using (true);

create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  numero bigint generated always as identity unique,
  user_id uuid references auth.users(id),
  email text, telefono text, nombre text,
  items jsonb not null, total numeric not null,
  envio jsonb, metodo text,
  estado text default 'pendiente',   -- pendiente | pagado | enviado | cancelado | vencido
  mp_payment_id text,
  creado timestamptz default now()
);
alter table pedidos add column if not exists pago_ref text;   -- id de la orden en Ualá
alter table pedidos enable row level security;
drop policy if exists "ver mis pedidos" on pedidos;
create policy "ver mis pedidos" on pedidos for select using (auth.uid() = user_id);

-- Crea el pedido y descuenta el stock en una sola transacción (nadie puede comprar lo mismo dos veces)
create or replace function crear_pedido(p_user uuid, p_email text, p_telefono text, p_nombre text, p_items jsonb, p_envio jsonb, p_metodo text)
returns table(o_numero bigint, o_total numeric, o_items jsonb) language plpgsql security definer as $$
declare it jsonb; prod productos%rowtype; q int; tot numeric := 0; lineas jsonb := '[]'::jsonb; n bigint;
begin
  for it in select * from jsonb_array_elements(p_items) loop
    q := (it->>'qty')::int;
    if q is null or q <= 0 then raise exception 'Cantidad inválida.'; end if;
    select * into prod from productos where sku = it->>'sku' for update;
    if not found then raise exception 'Hay un producto que ya no está disponible.'; end if;
    if prod.stock < q then raise exception 'No hay stock suficiente de %.', prod.nombre; end if;
    update productos set stock = stock - q, actualizado = now() where sku = prod.sku;
    tot := tot + prod.precio_final * q;
    lineas := lineas || jsonb_build_object('sku', prod.sku, 'nombre', prod.nombre, 'precio', prod.precio_final, 'qty', q,
                                           'color', coalesce(it->>'color',''), 'alm', coalesce(it->>'alm',''));
  end loop;
  insert into pedidos(user_id, email, telefono, nombre, items, total, envio, metodo, estado)
  values (p_user, p_email, p_telefono, p_nombre, lineas, tot, p_envio, p_metodo, 'pendiente') returning pedidos.numero into n;
  return query select n, tot, lineas;
end $$;

-- Cancela un pedido pendiente y devuelve el stock.  Uso manual:  select cancelar_pedido(12);
create or replace function cancelar_pedido(p_numero bigint) returns boolean language plpgsql security definer as $$
declare r pedidos%rowtype; it jsonb;
begin
  select * into r from pedidos where numero = p_numero and estado = 'pendiente' for update;
  if not found then return false; end if;
  for it in select * from jsonb_array_elements(r.items) loop
    update productos set stock = stock + (it->>'qty')::int where sku = it->>'sku';
  end loop;
  update pedidos set estado = 'cancelado' where id = r.id;
  return true;
end $$;

-- Devuelve el stock de pedidos pendientes más viejos que p_horas (se ejecuta solo con cada compra nueva)
create or replace function liberar_vencidos(p_horas int default 48) returns int language plpgsql security definer as $$
declare r record; it jsonb; c int := 0;
begin
  for r in select id, items from pedidos where estado = 'pendiente' and creado < now() - make_interval(hours => p_horas) for update loop
    for it in select * from jsonb_array_elements(r.items) loop
      update productos set stock = stock + (it->>'qty')::int where sku = it->>'sku';
    end loop;
    update pedidos set estado = 'vencido' where id = r.id; c := c + 1;
  end loop;
  return c;
end $$;

revoke execute on function crear_pedido(uuid,text,text,text,jsonb,jsonb,text) from public, anon, authenticated;
revoke execute on function cancelar_pedido(bigint) from public, anon, authenticated;
revoke execute on function liberar_vencidos(int) from public, anon, authenticated;

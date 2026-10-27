-- STOCK POR COLOR — pegar completo en Supabase > SQL Editor > Run (se puede correr más de una vez)
-- Los productos que NO usan stock por color siguen funcionando exactamente igual que antes.

alter table productos add column if not exists stock_colores jsonb;
-- Ejemplo: {"Negro": 5, "Blanco": 0, "Azul": 2}.  null = el producto no maneja stock por color.
-- Con stock por color, "stock" es siempre la suma de los colores (lo calcula el importador).

-- Suma stock a un producto (y a su color, si maneja stock por color). Lo usan cancelar_pedido y liberar_vencidos.
create or replace function reponer_stock(p_sku text, p_color text, p_qty int) returns void language plpgsql security definer as $$
declare prod productos%rowtype; col text := btrim(coalesce(p_color, ''));
begin
  select * into prod from productos where sku = p_sku for update;
  if not found then return; end if;
  if prod.stock_colores is not null and jsonb_typeof(prod.stock_colores) = 'object' and prod.stock_colores <> '{}'::jsonb then
    if jsonb_exists(prod.stock_colores, col) then
      update productos set stock_colores = jsonb_set(stock_colores, array[col], to_jsonb(coalesce((stock_colores->>col)::int, 0) + p_qty)),
                           stock = stock + p_qty, actualizado = now() where sku = p_sku;
    end if;   -- si ese color ya no existe en el producto, no se repone nada
  else
    update productos set stock = stock + p_qty, actualizado = now() where sku = p_sku;
  end if;
end $$;

-- Crea el pedido y descuenta el stock (del producto y de su color) en una sola transacción
create or replace function crear_pedido(p_user uuid, p_email text, p_telefono text, p_nombre text, p_items jsonb, p_envio jsonb, p_metodo text)
returns table(o_numero bigint, o_total numeric, o_items jsonb) language plpgsql security definer as $$
declare it jsonb; prod productos%rowtype; q int; col text; disp int; tot numeric := 0; lineas jsonb := '[]'::jsonb; n bigint;
begin
  for it in select * from jsonb_array_elements(p_items) loop
    q := (it->>'qty')::int;
    if q is null or q <= 0 then raise exception 'Cantidad inválida.'; end if;
    select * into prod from productos where sku = it->>'sku' for update;
    if not found then raise exception 'Hay un producto que ya no está disponible.'; end if;
    col := btrim(coalesce(it->>'color', ''));
    if prod.stock_colores is not null and jsonb_typeof(prod.stock_colores) = 'object' and prod.stock_colores <> '{}'::jsonb then
      -- producto con stock por color: el color es obligatorio y tiene que tener unidades
      if col = '' or not jsonb_exists(prod.stock_colores, col) then raise exception 'Elegí un color disponible de %.', prod.nombre; end if;
      disp := coalesce((prod.stock_colores->>col)::int, 0);
      if disp < q then
        if disp <= 0 then raise exception 'El color % de % se agotó. Elegí otro color.', col, prod.nombre;
        else raise exception 'Solo quedan % unidades del color % de %.', disp, col, prod.nombre; end if;
      end if;
      update productos set stock_colores = jsonb_set(stock_colores, array[col], to_jsonb(disp - q)), stock = stock - q, actualizado = now() where sku = prod.sku;
    else
      if prod.stock < q then raise exception 'No hay stock suficiente de %.', prod.nombre; end if;
      update productos set stock = stock - q, actualizado = now() where sku = prod.sku;
    end if;
    tot := tot + prod.precio_final * q;
    lineas := lineas || jsonb_build_object('sku', prod.sku, 'nombre', prod.nombre, 'precio', prod.precio_final, 'qty', q,
                                           'color', coalesce(it->>'color',''), 'alm', coalesce(it->>'alm',''));
  end loop;
  insert into pedidos(user_id, email, telefono, nombre, items, total, envio, metodo, estado)
  values (p_user, p_email, p_telefono, p_nombre, lineas, tot, p_envio, p_metodo, 'pendiente') returning pedidos.numero into n;
  return query select n, tot, lineas;
end $$;

-- Cancela un pedido pendiente y devuelve el stock (también el del color).  Uso manual:  select cancelar_pedido(12);
create or replace function cancelar_pedido(p_numero bigint) returns boolean language plpgsql security definer as $$
declare r pedidos%rowtype; it jsonb;
begin
  select * into r from pedidos where numero = p_numero and estado = 'pendiente' for update;
  if not found then return false; end if;
  for it in select * from jsonb_array_elements(r.items) loop
    perform reponer_stock(it->>'sku', it->>'color', (it->>'qty')::int);
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
      perform reponer_stock(it->>'sku', it->>'color', (it->>'qty')::int);
    end loop;
    update pedidos set estado = 'vencido' where id = r.id; c := c + 1;
  end loop;
  return c;
end $$;

revoke execute on function reponer_stock(text,text,int) from public, anon, authenticated;
revoke execute on function crear_pedido(uuid,text,text,text,jsonb,jsonb,text) from public, anon, authenticated;
revoke execute on function cancelar_pedido(bigint) from public, anon, authenticated;
revoke execute on function liberar_vencidos(int) from public, anon, authenticated;

-- Número de cliente (correlativo, se asigna al registrarse) y reseñas con nombre completo + número de cliente.
-- Pegar completo en Supabase > SQL Editor > Run. Se puede correr más de una vez sin problema.
-- Antes tiene que estar corrido supabase/resenas.sql (y resenas_foto.sql si vas a usar fotos).

create table if not exists clientes (
  numero  bigint generated always as identity primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  creado  timestamptz not null default now()
);
alter table clientes enable row level security;   -- privada: solo la lee el servidor

-- A cada cuenta nueva se le asigna el número siguiente
create or replace function crear_cliente() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.clientes (user_id, creado) values (new.id, now()) on conflict (user_id) do nothing;
  return new;
end $$;
drop trigger if exists trg_crear_cliente on auth.users;
create trigger trg_crear_cliente after insert on auth.users for each row execute function crear_cliente();

-- Cuentas que ya existían: se numeran por orden de registro (la más antigua es la 1)
insert into clientes (user_id, creado)
  select id, created_at from auth.users order by created_at
  on conflict (user_id) do nothing;

-- Si querés que el próximo número no empiece desde 1, sacá los "--" de la línea siguiente y poné el número que quieras:
-- alter table clientes alter column numero restart with 150;

-- Reseñas: número de cliente, y las que ya existían pasan a mostrar nombre y apellido completos
alter table resenas add column if not exists cliente_numero bigint;
update resenas r set cliente_numero = c.numero from clientes c where c.user_id = r.user_id and r.cliente_numero is null;
update resenas r set nombre = trim(u.raw_user_meta_data->>'nombre') from auth.users u
  where u.id = r.user_id and coalesce(trim(u.raw_user_meta_data->>'nombre'), '') <> '';

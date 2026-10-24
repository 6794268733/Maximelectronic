-- Reseñas de productos. Pegar completo en Supabase > SQL Editor > Run (se puede correr más de una vez).
create table if not exists resenas (
  id uuid primary key default gen_random_uuid(),
  pedido_numero bigint not null references pedidos(numero) on delete cascade,
  sku text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text,
  estrellas integer not null check (estrellas between 1 and 5),
  comentario text,
  estado text not null default 'pendiente',   -- pendiente | publicada | oculta
  creado timestamptz default now(),
  unique (pedido_numero, sku)                  -- una sola reseña por producto y por pedido
);
alter table resenas enable row level security;
drop policy if exists "ver resenas" on resenas;
-- Cualquiera ve las publicadas; cada cliente ve además las suyas. Nadie inserta ni modifica desde el navegador:
-- las reseñas se crean por /api/resena y se moderan por /api/admin (clave de servidor).
create policy "ver resenas" on resenas for select using (estado = 'publicada' or auth.uid() = user_id);
create index if not exists resenas_sku_pub on resenas(sku) where estado = 'publicada';
-- pedidos.estado ahora admite también: entregado

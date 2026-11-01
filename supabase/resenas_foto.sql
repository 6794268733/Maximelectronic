-- Foto opcional en las reseñas. Pegar completo en Supabase > SQL Editor > Run (se puede correr más de una vez).
alter table resenas add column if not exists foto text;
-- Bucket público para esas fotos: los nombres de archivo son aleatorios y las reseñas se publican solo cuando las aprobás.
insert into storage.buckets (id, name, public) values ('resenas', 'resenas', true)
  on conflict (id) do update set public = true;

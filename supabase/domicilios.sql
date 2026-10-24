-- Bucket privado para la foto opcional del domicilio (se puede correr más de una vez)
insert into storage.buckets (id, name, public) values ('domicilios', 'domicilios', false) on conflict (id) do nothing;

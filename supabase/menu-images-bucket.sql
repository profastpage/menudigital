-- =====================================================================
-- Bucket "menu-images" + RLS policies
-- ---------------------------------------------------------------------
-- Ejecutar en Supabase SQL Editor (one-time setup).
-- Permite a usuarios autenticados subir imágenes al bucket "menu-images"
-- solo bajo su propio prefijo {user_id}/... (aislamiento por usuario).
-- El bucket es público para LECTURA (las URLs públicas se embeben en
-- los menús publicados). La escritura requiere auth + match del prefijo.
-- =====================================================================

-- 1. Crear el bucket si no existe
insert into storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
select
  'menu-images',
  'menu-images',
  true,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  5242880  -- 5 MB
where not exists (
  select 1 from storage.buckets where id = 'menu-images'
);

-- 2. RLS policy: SELECT público (los menús publicados necesitan leer las imágenes)
--    Si ya existe, no hace nada.
do $$
begin
  if not exists (
    select 1 from storage.policies
    where name = 'menu-images-public-read' and bucket_id = 'menu-images'
  ) then
    create policy "menu-images-public-read"
      on storage.objects for select
      using (bucket_id = 'menu-images');
  end if;
end$$;

-- 3. RLS policy: INSERT solo si el prefijo del path coincide con auth.uid()
--    Path pattern: "{user_id}/{timestamp}-{random}.{ext}"
do $$
begin
  if not exists (
    select 1 from storage.policies
    where name = 'menu-images-auth-write' and bucket_id = 'menu-images'
  ) then
    create policy "menu-images-auth-write"
      on storage.objects for insert
      to authenticated
      with check (
        bucket_id = 'menu-images'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end$$;

-- 4. RLS policy: UPDATE/DELETE solo si el prefijo del path coincide con auth.uid()
do $$
begin
  if not exists (
    select 1 from storage.policies
    where name = 'menu-images-auth-update' and bucket_id = 'menu-images'
  ) then
    create policy "menu-images-auth-update"
      on storage.objects for update
      to authenticated
      using (
        bucket_id = 'menu-images'
        and (storage.foldername(name))[1] = auth.uid()::text
      )
      with check (
        bucket_id = 'menu-images'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from storage.policies
    where name = 'menu-images-auth-delete' and bucket_id = 'menu-images'
  ) then
    create policy "menu-images-auth-delete"
      on storage.objects for delete
      to authenticated
      using (
        bucket_id = 'menu-images'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end$$;

-- 5. Verificación
select 'menu-images bucket creado y policies aplicadas' as status,
       (select count(*) from storage.policies where bucket_id = 'menu-images') as policy_count;

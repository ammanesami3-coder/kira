-- ─────────────────────────────────────────────────────────────
-- Kira — Phase 5 · Migration 0010 · Storage bucket for car images
-- ─────────────────────────────────────────────────────────────
-- A PUBLIC bucket for car photos. Unlike booking PDFs these contain no PII
-- and are served on the public catalog via next/image, so the bucket is
-- public-read. Only the authenticated agency owner may upload / replace /
-- delete objects; the admin uploads from the dashboard with the owner's
-- session (subject to these policies), then records the public URL in
-- `car_images` through a Server Action.
--
-- Guarded for the PGlite test harness (no `storage` schema there): on PGlite
-- this whole block is a silent no-op, on Supabase it runs.
do $$
begin
  if exists (
    select 1 from information_schema.schemata where schema_name = 'storage'
  ) then
    -- Public bucket (idempotent).
    execute $sql$
      insert into storage.buckets (id, name, public)
      values ('car-images', 'car-images', true)
      on conflict (id) do nothing;
    $sql$;

    -- Anyone may read (public catalog images).
    execute $sql$
      drop policy if exists "public reads car images" on storage.objects;
    $sql$;
    execute $sql$
      create policy "public reads car images"
        on storage.objects for select
        to anon, authenticated
        using (bucket_id = 'car-images');
    $sql$;

    -- Only the authenticated owner may write/replace/delete.
    execute $sql$
      drop policy if exists "owner writes car images" on storage.objects;
    $sql$;
    execute $sql$
      create policy "owner writes car images"
        on storage.objects for insert
        to authenticated
        with check (bucket_id = 'car-images');
    $sql$;
    execute $sql$
      drop policy if exists "owner updates car images" on storage.objects;
    $sql$;
    execute $sql$
      create policy "owner updates car images"
        on storage.objects for update
        to authenticated
        using (bucket_id = 'car-images')
        with check (bucket_id = 'car-images');
    $sql$;
    execute $sql$
      drop policy if exists "owner deletes car images" on storage.objects;
    $sql$;
    execute $sql$
      create policy "owner deletes car images"
        on storage.objects for delete
        to authenticated
        using (bucket_id = 'car-images');
    $sql$;
  end if;
end
$$;

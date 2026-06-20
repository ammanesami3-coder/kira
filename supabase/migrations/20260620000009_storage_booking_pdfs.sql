-- ─────────────────────────────────────────────────────────────
-- Kira — Phase 4 · Migration 0009 · Storage bucket for booking PDFs
-- ─────────────────────────────────────────────────────────────
-- A PRIVATE bucket that holds the generated booking PDFs. The files
-- contain customer PII (name, phone, dates) so the bucket is NOT public:
--   • The Server Action writes with the service-role key (bypasses RLS)
--     and hands out short-/long-lived SIGNED URLs for the WhatsApp
--     gateway to fetch and for the admin to view.
--   • The authenticated owner may read objects directly.
--   • anon has no access whatsoever.
--
-- This statement targets Supabase's `storage` schema, which does NOT
-- exist in the PGlite harness used by `pnpm db:test`. The whole block is
-- therefore guarded: on PGlite it is a silent no-op, on Supabase it runs.
do $$
begin
  if exists (
    select 1 from information_schema.schemata where schema_name = 'storage'
  ) then
    -- Create the private bucket (idempotent).
    execute $sql$
      insert into storage.buckets (id, name, public)
      values ('booking-pdfs', 'booking-pdfs', false)
      on conflict (id) do nothing;
    $sql$;

    -- The authenticated agency owner may read the PDFs.
    execute $sql$
      drop policy if exists "owner reads booking pdfs" on storage.objects;
    $sql$;
    execute $sql$
      create policy "owner reads booking pdfs"
        on storage.objects for select
        to authenticated
        using (bucket_id = 'booking-pdfs');
    $sql$;
  end if;
end
$$;

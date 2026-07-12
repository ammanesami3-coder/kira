-- Owner-controlled booking extras ("options supplémentaires"): per-deployment
-- visibility + price overrides for the built-in extras catalog
-- (lib/booking/extras.ts). Shape (all keys optional, tolerantly parsed):
--   {
--     "enabled": false,                        -- hide the whole section
--     "items": {
--       "gps": { "enabled": false },           -- hide one extra
--       "full_insurance": { "price": 100 }     -- override one price
--     }
--   }
-- The default '{}' resolves to today's behavior (all extras, default prices),
-- so existing deployments are unaffected until their owner edits the setting.
alter table public.agency_settings
  add column if not exists booking_extras jsonb not null default '{}'::jsonb;

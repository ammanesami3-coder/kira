-- Per-agency opt-in for the Kira Bot notification path (gradual rollout).
-- The env flag KIRA_BOT_ENABLED stays the global master switch: the bot path
-- runs only when the flag is on AND this column is true. Default true so
-- flipping the env flag is enough for a single-tenant deployment; set it to
-- false to opt a specific agency out without touching env.
alter table public.agency_settings
  add column if not exists notify_via_bot boolean not null default true;

-- OPTIONAL: instant site rebuilds when sauna data changes.
--
-- The nightly GitHub Action (.github/workflows/nightly-rebuild.yml) is the
-- baseline freshness mechanism. Apply this trigger only if you also want the
-- prerendered site to rebuild within minutes of a Supabase edit (e.g. after
-- fixing a closed sauna from the admin modal).
--
-- How to apply: Supabase dashboard → SQL Editor → paste this file, replace
-- the placeholder URL with the same Vercel deploy hook used by the GitHub
-- Action, and run it.
--
-- Caveat: the trigger fires once per SQL statement, so a scraping session
-- that inserts/updates in many separate statements queues several Vercel
-- builds. Harmless (Vercel builds them in order) but wasteful — if you run
-- big scrapes often, drop the trigger and rely on the nightly rebuild:
--   drop trigger if exists saunas_rebuild_site on public.saunas;

create extension if not exists pg_net;

create or replace function public.trigger_site_rebuild()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform net.http_post(
    url := 'REPLACE_WITH_VERCEL_DEPLOY_HOOK_URL',
    body := '{}'::jsonb
  );
  return null;
end;
$$;

drop trigger if exists saunas_rebuild_site on public.saunas;

create trigger saunas_rebuild_site
after insert or update or delete on public.saunas
for each statement
execute function public.trigger_site_rebuild();

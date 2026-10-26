-- DayList: Aufräumen, damit sich in der Cloud nichts endlos ansammelt
-- Einmal im Supabase-Dashboard unter "SQL Editor" einfügen und auf "Run" klicken.
-- Danach räumt die Datenbank jede Nacht von selbst auf. Offene Aufgaben werden nie gelöscht.

create or replace function public.daylist_cleanup() returns void
language plpgsql security definer set search_path = public as $$
begin
  -- Gelöschte Aufgaben bleiben als Markierung stehen, damit andere Geräte davon erfahren.
  -- Nach 90 Tagen braucht sie niemand mehr (genauso lange merkt sich die App eine Löschung).
  delete from tasks where deleted and updated_at < now() - interval '90 days';

  -- Schon verschickte Erinnerungen: nur die letzten Tage werden gegen doppelte gebraucht
  if to_regclass('public.push_sent') is not null then
    delete from push_sent where sent_at < now() - interval '30 days';
  end if;

  -- Abgebrochene Google-Anmeldungen
  if to_regclass('public.google_oauth_states') is not null then
    delete from google_oauth_states where created_at < now() - interval '1 day';
  end if;

  -- Gruppenaufgaben, die erledigt oder ausgelassen sind und deren Frist 90 Tage her ist
  if to_regclass('public.group_tasks') is not null then
    delete from group_tasks
      where (done_at is not null or skipped) and due_date < current_date - 90;
  end if;
end $$;

revoke all on function public.daylist_cleanup() from public, anon, authenticated;

-- Jede Nacht um 3:45 Uhr (Zeit des Servers, UTC)
create extension if not exists pg_cron with schema pg_catalog;
select cron.unschedule('daylist-aufraeumen') where exists (select 1 from cron.job where jobname = 'daylist-aufraeumen');
select cron.schedule('daylist-aufraeumen', '45 3 * * *', $$ select public.daylist_cleanup() $$);

-- Gleich einmal aufräumen
select public.daylist_cleanup();

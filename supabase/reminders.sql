-- DayList: Tabellen und Zeitplan für Erinnerungen per Push-Nachricht
-- Einmal im Supabase-Dashboard unter "SQL Editor" einfügen. Vorher unten HIER-DEIN-GEHEIMWORT ersetzen
-- (dasselbe Wort wie im Secret CRON_SECRET), dann auf "Run" klicken.

-- Geräte, die Erinnerungen bekommen sollen (eine Zeile pro Gerät und Browser)
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  p256dh text not null,
  auth text not null,
  device text,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Eigene Geräte lesen" on public.push_subscriptions;
create policy "Eigene Geräte lesen" on public.push_subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Eigene Geräte anlegen" on public.push_subscriptions;
create policy "Eigene Geräte anlegen" on public.push_subscriptions
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Eigene Geräte ändern" on public.push_subscriptions;
create policy "Eigene Geräte ändern" on public.push_subscriptions
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Eigene Geräte löschen" on public.push_subscriptions;
create policy "Eigene Geräte löschen" on public.push_subscriptions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Schon verschickte Erinnerungen, damit keine doppelt kommt.
-- Ohne Regeln (policies): nur der Erinnerungsdienst selbst darf hier lesen und schreiben.
create table if not exists public.push_sent (
  user_id uuid not null references auth.users on delete cascade,
  task_id text not null,
  remind_at text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, task_id, remind_at)
);

alter table public.push_sent enable row level security;

-- Schnelle Suche nach fälligen Erinnerungen
create index if not exists tasks_remind_at on public.tasks ((data->>'remindAt')) where not deleted;

-- Jede Minute den Erinnerungsdienst aufrufen
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'daylist-erinnerungen',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://lagujegkqtgqandkzxjj.supabase.co/functions/v1/reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', 'HIER-DEIN-GEHEIMWORT'),
    body := '{}'::jsonb
  );
  $$
);

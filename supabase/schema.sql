-- DayList: Tabelle für die automatische Sicherung
-- Einmal im Supabase-Dashboard unter "SQL Editor" einfügen und auf "Run" klicken.

-- Jede Zeile ist eine Aufgabe eines Kontos. Gelöschte Aufgaben bleiben als
-- "deleted" stehen, damit auch andere Geräte von der Löschung erfahren.
create table if not exists public.tasks (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  data jsonb,
  deleted boolean not null default false,
  updated_at timestamptz not null,
  primary key (user_id, id)
);

-- Zeilensicherheit: Jedes Konto sieht und ändert nur seine eigenen Aufgaben
alter table public.tasks enable row level security;

drop policy if exists "Eigene Aufgaben lesen" on public.tasks;
create policy "Eigene Aufgaben lesen" on public.tasks
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Eigene Aufgaben anlegen" on public.tasks;
create policy "Eigene Aufgaben anlegen" on public.tasks
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Eigene Aufgaben ändern" on public.tasks;
create policy "Eigene Aufgaben ändern" on public.tasks
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

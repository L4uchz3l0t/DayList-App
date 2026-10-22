-- DayList: Gruppen (zum Beispiel WG-Putzplan)
-- Einmal im Supabase-Dashboard unter "SQL Editor" einfügen und auf "Run" klicken.
-- Das Skript kann gefahrlos mehrmals ausgeführt werden.
--
-- Rollen: Wer eine Gruppe erstellt, ist Verwalter (admin). Verwalter laden ein, teilen Aufgaben zu
-- und können weitere Verwalter ernennen. Mitglieder sehen alles und haken ihre eigenen Aufgaben ab.

-- Gruppen ------------------------------------------------------------------------------------------
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  -- Zeitzone für Erinnerungen und wiederkehrende Aufgaben, zum Beispiel Europe/Berlin
  timezone text not null default 'Europe/Berlin',
  created_by uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

-- Mitglieder: eingeladen per E-Mail-Adresse. user_id wird bei der ersten Anmeldung eingetragen.
create table if not exists public.group_members (
  group_id uuid not null references public.groups on delete cascade,
  email text not null check (email = lower(trim(email)) and email like '%@%'),
  display_name text not null check (length(trim(display_name)) > 0),
  user_id uuid references auth.users on delete set null,
  role text not null default 'member' check (role in ('admin', 'member')),
  -- Gruppenaufgaben dieses Mitglieds auch in seinem eigenen Kalender zeigen und daran erinnern
  show_in_calendar boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (group_id, email)
);
create index if not exists group_members_user on public.group_members (user_id);

-- Wiederkehrende Aufgaben: reihum, jede Woche (oder alle n Wochen) die nächste Person
create table if not exists public.group_series (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  title text not null check (length(trim(title)) > 0),
  interval_weeks int not null default 1 check (interval_weeks between 1 and 8),
  -- Reihenfolge der Personen (E-Mail-Adressen der Mitglieder)
  rotation text[] not null check (cardinality(rotation) > 0),
  -- Frist der ersten Runde; jede weitere Runde liegt interval_weeks Wochen später
  first_due date not null,
  time text check (time ~ '^\d{2}:\d{2}$'),
  reminder int check (reminder >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Aufgaben einer Gruppe, jede mit einer zugeteilten Person und einer Frist
create table if not exists public.group_tasks (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  title text not null check (length(trim(title)) > 0),
  assignee text not null,
  due_date date not null,
  time text check (time ~ '^\d{2}:\d{2}$'),
  reminder int check (reminder >= 0),
  -- Wird automatisch aus Frist, Uhrzeit, Erinnerung und Zeitzone der Gruppe berechnet
  remind_at timestamptz,
  done_at timestamptz,
  done_by uuid references auth.users on delete set null,
  -- Bei wiederkehrenden Aufgaben: zu welcher Reihe und welcher Runde (0, 1, 2 …) sie gehört
  series_id uuid references public.group_series on delete set null,
  occurrence int,
  -- Diese Runde auslassen (statt löschen, damit sie nicht neu entsteht)
  skipped boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (series_id, occurrence)
);
create index if not exists group_tasks_group on public.group_tasks (group_id, due_date);
create index if not exists group_tasks_remind on public.group_tasks (remind_at) where done_at is null and not skipped;

-- Hilfsfunktionen für die Regeln ------------------------------------------------------------------
create or replace function public.is_group_member(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from group_members where group_id = gid and user_id = auth.uid())
$$;

create or replace function public.is_group_admin(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from group_members where group_id = gid and user_id = auth.uid() and role = 'admin')
$$;

-- Erinnerungszeitpunkt berechnen, wenn eine Aufgabe angelegt oder geändert wird
create or replace function public.group_task_remind_at() returns trigger
language plpgsql set search_path = public as $$
declare tz text;
begin
  select timezone into tz from groups where id = new.group_id;
  if new.time is null or new.reminder is null then
    new.remind_at := null;
  else
    new.remind_at := ((new.due_date + new.time::time)::timestamp at time zone coalesce(tz, 'Europe/Berlin'))
      - make_interval(mins => new.reminder);
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists group_tasks_remind_at on public.group_tasks;
create trigger group_tasks_remind_at before insert or update on public.group_tasks
  for each row execute function public.group_task_remind_at();

-- Mindestens ein Verwalter muss bleiben
create or replace function public.keep_one_admin() returns trigger
language plpgsql set search_path = public as $$
begin
  if old.role = 'admin' and (tg_op = 'DELETE' or new.role <> 'admin')
     and exists (select 1 from groups where id = old.group_id)
     and not exists (
       select 1 from group_members
       where group_id = old.group_id and role = 'admin' and email <> old.email
     ) then
    raise exception 'Eine Gruppe braucht mindestens einen Verwalter';
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists group_members_keep_admin on public.group_members;
create trigger group_members_keep_admin before update or delete on public.group_members
  for each row execute function public.keep_one_admin();

-- Regeln (Row Level Security) ---------------------------------------------------------------------
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_series enable row level security;
alter table public.group_tasks enable row level security;

drop policy if exists "Mitglieder sehen Gruppe" on public.groups;
create policy "Mitglieder sehen Gruppe" on public.groups for select to authenticated
  using (public.is_group_member(id));
drop policy if exists "Verwalter ändern Gruppe" on public.groups;
create policy "Verwalter ändern Gruppe" on public.groups for update to authenticated
  using (public.is_group_admin(id)) with check (public.is_group_admin(id));
drop policy if exists "Verwalter löschen Gruppe" on public.groups;
create policy "Verwalter löschen Gruppe" on public.groups for delete to authenticated
  using (public.is_group_admin(id));

drop policy if exists "Mitglieder sehen Mitglieder" on public.group_members;
create policy "Mitglieder sehen Mitglieder" on public.group_members for select to authenticated
  using (public.is_group_member(group_id));
drop policy if exists "Verwalter laden ein" on public.group_members;
create policy "Verwalter laden ein" on public.group_members for insert to authenticated
  with check (public.is_group_admin(group_id));
drop policy if exists "Verwalter ändern Mitglieder" on public.group_members;
create policy "Verwalter ändern Mitglieder" on public.group_members for update to authenticated
  using (public.is_group_admin(group_id)) with check (public.is_group_admin(group_id));
drop policy if exists "Verwalter entfernen, jeder darf austreten" on public.group_members;
create policy "Verwalter entfernen, jeder darf austreten" on public.group_members for delete to authenticated
  using (public.is_group_admin(group_id) or user_id = auth.uid());

drop policy if exists "Mitglieder sehen Reihen" on public.group_series;
create policy "Mitglieder sehen Reihen" on public.group_series for select to authenticated
  using (public.is_group_member(group_id));
drop policy if exists "Verwalter verwalten Reihen" on public.group_series;
create policy "Verwalter verwalten Reihen" on public.group_series for all to authenticated
  using (public.is_group_admin(group_id)) with check (public.is_group_admin(group_id));

drop policy if exists "Mitglieder sehen Aufgaben" on public.group_tasks;
create policy "Mitglieder sehen Aufgaben" on public.group_tasks for select to authenticated
  using (public.is_group_member(group_id));
drop policy if exists "Verwalter verwalten Aufgaben" on public.group_tasks;
create policy "Verwalter verwalten Aufgaben" on public.group_tasks for all to authenticated
  using (public.is_group_admin(group_id)) with check (public.is_group_admin(group_id));

-- Aktionen, die besondere Rechte brauchen ---------------------------------------------------------

-- Neue Gruppe anlegen; wer sie anlegt, wird Verwalter
create or replace function public.create_group(group_name text, my_name text, tz text default 'Europe/Berlin')
returns uuid language plpgsql security definer set search_path = public as $$
declare gid uuid;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  insert into groups (name, timezone, created_by) values (trim(group_name), coalesce(tz, 'Europe/Berlin'), auth.uid())
    returning id into gid;
  insert into group_members (group_id, email, display_name, user_id, role)
    values (gid, lower(auth.email()), trim(my_name), auth.uid(), 'admin');
  return gid;
end $$;

-- Einladungen an die eigene E-Mail-Adresse annehmen (beim Öffnen der App)
create or replace function public.claim_group_invites() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update group_members set user_id = auth.uid()
    where email = lower(auth.email()) and user_id is null;
  get diagnostics n = row_count;
  return n;
end $$;

-- Eigene Aufgabe abhaken oder wieder öffnen (Verwalter dürfen jede)
create or replace function public.set_group_task_done(task_id uuid, done boolean) returns void
language plpgsql security definer set search_path = public as $$
declare t group_tasks;
begin
  select * into t from group_tasks where id = task_id;
  if t.id is null or not is_group_member(t.group_id) then raise exception 'Keine Berechtigung'; end if;
  if not is_group_admin(t.group_id) and not exists (
    select 1 from group_members where group_id = t.group_id and email = t.assignee and user_id = auth.uid()
  ) then
    raise exception 'Nur die zugeteilte Person kann abhaken';
  end if;
  update group_tasks
    set done_at = case when done then now() else null end,
        done_by = case when done then auth.uid() else null end
    where id = task_id;
end $$;

-- Eigene Einstellung: Gruppenaufgaben im eigenen Kalender zeigen
create or replace function public.set_group_calendar(gid uuid, show boolean) returns void
language sql security definer set search_path = public as $$
  update group_members set show_in_calendar = show where group_id = gid and user_id = auth.uid()
$$;

-- Wiederkehrende Aufgaben: alle Runden anlegen, deren Frist höchstens 7 Tage in der Zukunft liegt.
-- Schon angelegte Runden bleiben unverändert, so bleiben Anpassungen einzelner Wochen erhalten.
create or replace function public.generate_group_tasks() returns int
language plpgsql security definer set search_path = public as $$
declare s group_series; k int; due date; created int := 0; members text[];
begin
  for s in select * from group_series where active loop
    -- Nur Personen, die noch Mitglied sind; die Reihenfolge bleibt erhalten
    select array_agg(r order by ord) into members
      from unnest(s.rotation) with ordinality as x(r, ord)
      where exists (select 1 from group_members m where m.group_id = s.group_id and m.email = r);
    continue when members is null;
    k := 0;
    loop
      due := s.first_due + (k * s.interval_weeks * 7);
      exit when due > current_date + 7;
      if due >= current_date - 7 then
        insert into group_tasks (group_id, title, assignee, due_date, time, reminder, series_id, occurrence)
          values (s.group_id, s.title, members[(k % cardinality(members)) + 1], due, s.time, s.reminder, s.id, k)
          on conflict (series_id, occurrence) do nothing;
        if found then created := created + 1; end if;
      end if;
      k := k + 1;
    end loop;
  end loop;
  return created;
end $$;

-- Rechte für angemeldete Nutzer
grant execute on function public.create_group(text, text, text) to authenticated;
grant execute on function public.claim_group_invites() to authenticated;
grant execute on function public.set_group_task_done(uuid, boolean) to authenticated;
grant execute on function public.set_group_calendar(uuid, boolean) to authenticated;
grant execute on function public.generate_group_tasks() to authenticated;

-- Einmal am Tag neue Runden anlegen (zusätzlich legt die App sie beim Öffnen an)
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('daylist-gruppen-runden', '15 3 * * *', $$ select public.generate_group_tasks() $$);

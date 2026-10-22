-- DayList: Verbindung zum Google Kalender
-- Einmal im Supabase-Dashboard unter "SQL Editor" einfügen und auf "Run" klicken.
-- Das Skript kann gefahrlos mehrmals ausgeführt werden.
--
-- Die Tabellen hier liest und schreibt nur der Dienst "google-calendar" (supabase/functions/google-calendar).
-- Die App selbst kommt nicht an sie heran: Row Level Security ist an, es gibt bewusst keine Regeln für Konten.

-- Pro DayList-Konto: der Zugangsschlüssel von Google und die gewählten Kalender
create table if not exists public.google_connections (
  user_id uuid primary key references auth.users on delete cascade,
  google_email text,
  -- Langlebiger Schlüssel ("refresh token"), mit dem der Dienst Termine abholen darf (nur lesen)
  refresh_token text not null,
  -- IDs der angezeigten Kalender; leer = die in Google sichtbaren Kalender
  calendars text[],
  updated_at timestamptz not null default now()
);

-- Kurzlebige Merkzettel während der Anmeldung bei Google (Schutz gegen untergeschobene Anmeldungen)
create table if not exists public.google_oauth_states (
  state text primary key,
  user_id uuid not null references auth.users on delete cascade,
  return_to text not null,
  created_at timestamptz not null default now()
);

alter table public.google_connections enable row level security;
alter table public.google_oauth_states enable row level security;
revoke all on public.google_connections from anon, authenticated;
revoke all on public.google_oauth_states from anon, authenticated;

/*
  Zugangsdaten für die automatische Sicherung bei Supabase.
  Beide Werte stehen im Supabase-Dashboard unter "Project Settings → API".
  Der "publishable"/"anon" Schlüssel ist dafür gedacht, in der App zu stehen: Er erlaubt nur,
  was die Regeln der Tabelle zulassen (jedes Konto sieht nur seine eigenen Aufgaben).
  Solange die Werte leer sind, ist die automatische Sicherung in der App ausgeblendet.
*/
const PROJECT_URL = ''
const PUBLISHABLE_KEY = ''

// Für Tests lassen sich beide Werte beim Bauen über Umgebungsvariablen ersetzen
export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL || PROJECT_URL
export const SUPABASE_KEY: string = import.meta.env.VITE_SUPABASE_KEY || PUBLISHABLE_KEY

export const isCloudConfigured = SUPABASE_URL !== '' && SUPABASE_KEY !== ''

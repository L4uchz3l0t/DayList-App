import type { SupabaseClient } from '@supabase/supabase-js'
import type { RemoteRow } from './reconcile'

/*
  Lesen und Schreiben der Cloud-Tabelle "tasks" (Aufbau in supabase/schema.sql).
  Welche Zeilen ein Konto sehen darf, regelt die Tabelle selbst.
*/

const PAGE_SIZE = 1000

/** Lädt alle Zeilen des angemeldeten Kontos. */
export async function fetchRemoteRows(supabase: SupabaseClient): Promise<RemoteRow[]> {
  const rows: RemoteRow[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, data, deleted, updated_at')
      .order('id')
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    rows.push(...(data as RemoteRow[]))
    if (data.length < PAGE_SIZE) return rows
  }
}

/** Schreibt Zeilen in die Cloud. Gibt es eine Aufgabe schon, wird sie überschrieben. */
export async function pushRows(supabase: SupabaseClient, userId: string, rows: RemoteRow[]): Promise<void> {
  for (let i = 0; i < rows.length; i += PAGE_SIZE) {
    const chunk = rows.slice(i, i + PAGE_SIZE).map((row) => ({ ...row, user_id: userId }))
    const { error } = await supabase.from('tasks').upsert(chunk, { onConflict: 'user_id,id' })
    if (error) throw error
  }
}

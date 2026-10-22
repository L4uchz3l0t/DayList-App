/*
  Gruppen (zum Beispiel ein WG-Putzplan). Die Daten liegen in der Cloud (Supabase, siehe supabase/groups.sql),
  nicht auf dem Gerät: Alle Mitglieder sollen denselben Stand sehen.
  Die Feldnamen entsprechen den Spalten der Tabellen.
*/

export type GroupRole = 'admin' | 'member'

export interface GroupMember {
  group_id: string
  /** E-Mail-Adresse, kleingeschrieben; damit wird eingeladen und zugeteilt */
  email: string
  display_name: string
  /** Leer, solange die Person die Einladung noch nicht angenommen hat (noch nie angemeldet) */
  user_id: string | null
  role: GroupRole
  /** Eigene Gruppenaufgaben auch unter Heute und im Kalender zeigen und daran erinnern */
  show_in_calendar: boolean
  /** Eigene Einstellung: Gruppe steht in der Übersicht oben */
  pinned: boolean
}

export interface GroupSeries {
  id: string
  group_id: string
  title: string
  interval_weeks: number
  /** Reihenfolge der Personen (E-Mail-Adressen) */
  rotation: string[]
  /** Frist der ersten Runde ("JJJJ-MM-TT") */
  first_due: string
  time: string | null
  reminder: number | null
  active: boolean
}

export interface GroupTask {
  id: string
  group_id: string
  title: string
  /** E-Mail-Adresse der zugeteilten Person */
  assignee: string
  /** Frist ("JJJJ-MM-TT") */
  due_date: string
  time: string | null
  reminder: number | null
  done_at: string | null
  series_id: string | null
  occurrence: number | null
  skipped: boolean
}

export interface Group {
  id: string
  name: string
  timezone: string
  members: GroupMember[]
  tasks: GroupTask[]
  series: GroupSeries[]
}

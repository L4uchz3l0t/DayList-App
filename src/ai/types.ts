import type { TaskKind } from '../tasks/types'

/*
  Die Schnittstelle zwischen App und KI (siehe /mnt/project-files/plaene/ki-plan.md).
  Solange eine KI genau diese Anfragen versteht und diese Antworten gibt, muss die App nicht geändert werden.
*/

/** Anfrage "Aufgabe oder Termin?" */
export interface ClassifyRequest {
  action: 'classify'
  text: string
  /** Heutiger Tag "JJJJ-MM-TT" */
  today: string
  timeZone: string
}

export interface ClassifyResult {
  kind: TaskKind
  /** Titel ohne die erkannten Angaben zu Tag und Uhrzeit */
  title: string
  /** Erkannter Tag "JJJJ-MM-TT" */
  date?: string
  /** Erkannte Uhrzeit "HH:MM" */
  time?: string
}

/** Ein schon belegter Zeitraum im Kalender */
export interface BusySlot {
  date: string
  /** "HH:MM"; ohne Uhrzeit ist der Termin ganztägig und blockiert nichts */
  from: string
  to: string
  title: string
}

/** Anfrage "Woche planen" */
export interface PlanWeekRequest {
  action: 'planWeek'
  wishes: string
  today: string
  timeZone: string
  busy: BusySlot[]
  openTasks: { id: string; title: string }[]
}

export interface Proposal {
  title: string
  kind: TaskKind
  date: string
  time?: string
  durationMinutes?: number
  reason?: string
}

export interface PlanWeekResult {
  proposals: Proposal[]
  /** Rückfrage der KI an dich, zum Beispiel ob etwas lieber anders verteilt werden soll */
  question?: string
}

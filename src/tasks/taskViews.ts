import { addDays, formatShortDate, parseDateKey, toDateKey } from './dates'
import type { Task } from './types'

/*
  Auswahl und Sortierung der Aufgaben für die einzelnen Ansichten.
  Reine Funktionen ohne Oberfläche, damit sie sich leicht testen lassen.
*/

/** Wichtige Aufgaben zuerst, sonst bleibt die Reihenfolge erhalten. */
export function byPriority(a: Task, b: Task): number {
  return Number(b.priority === 'high') - Number(a.priority === 'high')
}

/** Offen und der geplante Tag liegt vor heute. */
export function isOverdue(task: Task, todayKey: string): boolean {
  return task.status === 'open' && task.plannedDate !== undefined && task.plannedDate < todayKey
}

/** Überfällige Aufgaben, wichtige zuerst, dann die ältesten. */
export function getOverdueTasks(tasks: Task[], todayKey: string): Task[] {
  return tasks
    .filter((task) => isOverdue(task, todayKey))
    .sort((a, b) => byPriority(a, b) || a.plannedDate!.localeCompare(b.plannedDate!))
}

/** Aufgaben unter Irgendwann (ohne geplanten Tag), getrennt nach offen und erledigt. */
export function getInboxTasks(tasks: Task[]): { open: Task[]; done: Task[] } {
  const inbox = tasks.filter((task) => task.plannedDate === undefined)
  return {
    open: inbox.filter((task) => task.status === 'open').sort(byPriority),
    done: inbox.filter((task) => task.status === 'done'),
  }
}

export interface WeekDay {
  dateKey: string
  /** Für diesen Tag geplante Aufgaben: offene (wichtige zuerst), dann erledigte */
  tasks: Task[]
  /** Offene Aufgaben, deren Frist an diesem Tag endet, egal wann sie geplant sind */
  deadlines: Task[]
}

/** Ein Tag mit seinen geplanten Aufgaben und Fristen. */
export function getDay(tasks: Task[], dateKey: string): WeekDay {
  const planned = tasks.filter((task) => task.plannedDate === dateKey)
  return {
    dateKey,
    tasks: [
      ...planned.filter((task) => task.status === 'open').sort(byPriority),
      ...planned.filter((task) => task.status === 'done'),
    ],
    deadlines: tasks.filter((task) => task.status === 'open' && task.dueDate === dateKey),
  }
}

/** Die nächsten `count` Tage ab heute mit ihren Aufgaben und Fristen. */
export function getWeekDays(tasks: Task[], todayKey: string, count = 7): WeekDay[] {
  const start = parseDateKey(todayKey)
  return Array.from({ length: count }, (_, index) => getDay(tasks, toDateKey(addDays(start, index))))
}

/** Anzahl der geplanten Aufgaben (offen und erledigt) je Tag, für die Färbung im Kalender. */
export function countTasksByDay(tasks: Task[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const task of tasks) {
    if (task.plannedDate) counts.set(task.plannedDate, (counts.get(task.plannedDate) ?? 0) + 1)
  }
  return counts
}

/** Farbstufe eines Kalendertags: 0 = keine Aufgabe, 1 = eine, 2 = zwei bis drei, 3 = vier bis fünf, 4 = sechs und mehr. */
export function heatLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 5) return 3
  return 4
}

/** Aufgaben, deren Titel den Suchtext enthält (Groß- und Kleinschreibung egal). Leere Suche = alle. */
export function searchTasks(tasks: Task[], query: string): Task[] {
  const needle = query.trim().toLocaleLowerCase('de-DE')
  if (needle === '') return tasks
  return tasks.filter((task) => task.title.toLocaleLowerCase('de-DE').includes(needle))
}

/** Offene Aufgaben mit geplantem Tag ab heute, nach Datum sortiert. */
export function getUpcomingTasks(tasks: Task[], todayKey: string): Task[] {
  return tasks
    .filter((task) => task.status === 'open' && task.plannedDate !== undefined && task.plannedDate >= todayKey)
    .sort((a, b) => a.plannedDate!.localeCompare(b.plannedDate!) || byPriority(a, b))
}

export type DayKind = 'someday' | 'today' | 'tomorrow' | 'other'

/** Ordnet einen geplanten Tag ein: ohne Tag, heute, morgen oder ein anderer Tag. */
export function getDayKind(dateKey: string | undefined, todayKey: string): DayKind {
  if (!dateKey) return 'someday'
  if (dateKey === todayKey) return 'today'
  if (dateKey === toDateKey(addDays(parseDateKey(todayKey), 1))) return 'tomorrow'
  return 'other'
}

const GERMAN_DAY_WORDS = { someday: 'Irgendwann', today: 'Heute', tomorrow: 'Morgen' }

/** Kurzer Name für einen geplanten Tag: "Irgendwann", "Heute", "Morgen" oder "21. Okt." */
export function describePlannedDay(
  dateKey: string | undefined,
  todayKey: string,
  words: { someday: string; today: string; tomorrow: string } = GERMAN_DAY_WORDS,
  locale = 'de-DE',
): string {
  const kind = getDayKind(dateKey, todayKey)
  return kind === 'other' ? formatShortDate(dateKey!, locale) : words[kind]
}

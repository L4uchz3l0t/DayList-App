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

/** Aufgaben im Eingang (ohne geplanten Tag), getrennt nach offen und erledigt. */
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

/** Die nächsten `count` Tage ab heute mit ihren Aufgaben und Fristen. */
export function getWeekDays(tasks: Task[], todayKey: string, count = 7): WeekDay[] {
  const start = parseDateKey(todayKey)
  return Array.from({ length: count }, (_, index) => {
    const dateKey = toDateKey(addDays(start, index))
    const planned = tasks.filter((task) => task.plannedDate === dateKey)
    return {
      dateKey,
      tasks: [
        ...planned.filter((task) => task.status === 'open').sort(byPriority),
        ...planned.filter((task) => task.status === 'done'),
      ],
      deadlines: tasks.filter((task) => task.status === 'open' && task.dueDate === dateKey),
    }
  })
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

/** Kurzer Name für einen geplanten Tag: "Eingang", "Heute", "Morgen" oder "21. Okt." */
export function describePlannedDay(dateKey: string | undefined, todayKey: string): string {
  if (!dateKey) return 'Eingang'
  if (dateKey === todayKey) return 'Heute'
  if (dateKey === toDateKey(addDays(parseDateKey(todayKey), 1))) return 'Morgen'
  return formatShortDate(dateKey)
}

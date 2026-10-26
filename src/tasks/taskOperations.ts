import { createId } from './createId'
import { toDateKey } from './dates'
import { nextOccurrence } from './repeat'
import type { Task, TaskKind, TaskPriority, TaskRepeat, TaskStatus } from './types'

/**
 * Alle Aufgaben-Aktionen als einfache Funktionen.
 * Sie verändern nichts direkt, sondern geben immer eine neue Liste zurück.
 * So lassen sie sich leicht testen, und die Oberfläche bleibt von der Logik getrennt.
 * `now` ist der aktuelle Zeitpunkt (ISO-Text) und wird für die Zeitstempel verwendet.
 */

/** Felder, die beim Bearbeiten geändert werden können. `undefined` löscht einen Wert. */
export interface TaskChanges {
  title?: string
  kind?: TaskKind
  status?: TaskStatus
  plannedDate?: string | undefined
  dueDate?: string | undefined
  priority?: TaskPriority | undefined
  time?: string | undefined
  reminder?: number | undefined
  repeat?: TaskRepeat | undefined
}

/** Angaben für eine neue Aufgabe. Nur der Titel ist Pflicht. */
export interface NewTaskInput {
  title: string
  kind?: TaskKind
  plannedDate?: string
  dueDate?: string
  priority?: TaskPriority
  time?: string
  reminder?: number
  repeat?: TaskRepeat
}

/**
 * Berechnet den Zeitpunkt der Erinnerung aus geplantem Tag, Uhrzeit und Vorlauf in der Zeitzone dieses Geräts.
 * Ohne Tag, Uhrzeit oder Erinnerung gibt es keinen Zeitpunkt.
 */
export function withRemindAt(task: Task): Task {
  const { remindAt: _old, ...rest } = task
  if (!task.plannedDate || !task.time || task.reminder === undefined) return rest
  const [year, month, day] = task.plannedDate.split('-').map(Number)
  const [hours, minutes] = task.time.split(':').map(Number)
  const at = new Date(year, month - 1, day, hours, minutes - task.reminder)
  return { ...rest, remindAt: at.toISOString() }
}

/** Erstellt eine neue, offene Aufgabe. Ohne geplanten Tag landet sie unter Irgendwann. */
export function createTask(input: NewTaskInput, now: string): Task {
  const task: Task = { id: createId(), title: input.title.trim(), status: 'open', createdAt: now, updatedAt: now }
  if (input.kind === 'event') task.kind = 'event'
  if (input.plannedDate) task.plannedDate = input.plannedDate
  if (input.dueDate) task.dueDate = input.dueDate
  if (input.priority) task.priority = input.priority
  if (input.time) task.time = input.time
  if (input.reminder !== undefined) task.reminder = input.reminder
  if (input.repeat && task.plannedDate) task.repeat = input.repeat
  return withRemindAt(task)
}

/** Ändert eine Aufgabe. Ein leerer Titel wird ignoriert, damit keine namenlosen Aufgaben entstehen. */
export function updateTask(tasks: Task[], id: string, changes: TaskChanges, now: string): Task[] {
  return tasks.map((task) => {
    if (task.id !== id) return task

    const updated: Task = { ...task, updatedAt: now }
    if (changes.title !== undefined && changes.title.trim() !== '') updated.title = changes.title.trim()
    if (changes.status !== undefined && changes.status !== task.status) {
      updated.status = changes.status
      if (changes.status === 'done') updated.doneAt = now
      else delete updated.doneAt
    }
    if (changes.kind === 'event') updated.kind = 'event'
    else if ('kind' in changes) delete updated.kind
    for (const key of ['plannedDate', 'dueDate', 'priority', 'time', 'reminder', 'repeat'] as const) {
      if (!(key in changes)) continue
      const value = changes[key]
      if (value === undefined || value === '') {
        delete updated[key]
      } else {
        // TypeScript weiß hier nicht, welcher der Schlüssel es ist, daher die Umwandlung
        ;(updated as unknown as Record<string, string | number>)[key] = value
      }
    }
    // Ohne Tag keine Wiederholung
    if (!updated.plannedDate) delete updated.repeat
    return withRemindAt(updated)
  })
}

/**
 * Erledigt eine offene Aufgabe oder öffnet eine erledigte wieder.
 * Wiederholt sich die Aufgabe, entsteht beim Erledigen der nächste Eintrag der Reihe.
 * Wird sie gleich wieder geöffnet, verschwindet dieser Eintrag wieder (solange er unverändert ist).
 */
export function toggleTaskStatus(tasks: Task[], id: string, now: string): Task[] {
  const task = tasks.find((t) => t.id === id)
  if (!task) return tasks
  if (task.status === 'open') {
    const todayKey = toDateKey(new Date(now))
    // Erledigt vor dem geplanten Tag: der nächste Eintrag kommt nach diesem Tag, sonst nach heute
    const after = task.plannedDate && task.plannedDate > todayKey ? task.plannedDate : todayKey
    const next = task.kind === 'event' ? null : nextOccurrence(task, after, now)
    const updated = updateTask(tasks, id, { status: 'done', repeat: undefined }, now)
    if (!next) return updateTask(tasks, id, { status: 'done' }, now)
    const result = updated.map((t) => (t.id === id ? { ...t, nextId: next.id } : t))
    return result.some((t) => t.id === next.id) ? result : [...result, next]
  }
  const next = task.nextId ? tasks.find((t) => t.id === task.nextId) : undefined
  const reopened = updateTask(tasks, id, { status: 'open' }, now).map((t) => {
    if (t.id !== id || !next) return t
    // Die Wiederholung kehrt zu diesem Eintrag zurück
    const { nextId: _nextId, ...rest } = t
    return { ...rest, repeat: next.repeat, seriesId: next.seriesId }
  })
  const untouched = next && next.status === 'open' && next.createdAt === next.updatedAt
  return untouched ? reopened.filter((t) => t.id !== next.id) : reopened
}

/** Plant eine Aufgabe für einen bestimmten Tag ("JJJJ-MM-TT"). */
export function scheduleTask(tasks: Task[], id: string, dateKey: string, now: string): Task[] {
  return updateTask(tasks, id, { plannedDate: dateKey }, now)
}

/** Nimmt den geplanten Tag weg: Die Aufgabe liegt dann wieder unter Irgendwann. */
export function moveTaskToInbox(tasks: Task[], id: string, now: string): Task[] {
  return updateTask(tasks, id, { plannedDate: undefined }, now)
}

/** Löscht eine Aufgabe endgültig aus der Liste. */
export function deleteTask(tasks: Task[], id: string): Task[] {
  return tasks.filter((task) => task.id !== id)
}

/** Stellt eine gelöschte Aufgabe wieder her (für "Rückgängig"). Doppelte Einträge werden verhindert. */
export function restoreTask(tasks: Task[], task: Task): Task[] {
  if (tasks.some((t) => t.id === task.id)) return tasks
  return [...tasks, task]
}

/** Erledigte Aufgaben unter Irgendwann verschwinden einen Tag nach dem Abhaken */
const INBOX_DONE_KEEP_MS = 24 * 60 * 60 * 1000

/** Vergangene Tage im Kalender: erledigte Aufgaben und Termine bleiben so viele Tage (ein Monat) */
export const PAST_KEEP_DAYS = 30

/**
 * Findet Aufgaben, die von selbst aufgeräumt werden, damit sich nicht endlos viel ansammelt:
 * erledigte Aufgaben unter Irgendwann nach einem Tag, erledigte Aufgaben und Termine aus dem Kalender
 * nach einem Monat. Offene Aufgaben bleiben immer, auch wenn sie überfällig sind.
 * `oldestKey` ist der älteste Tag ("JJJJ-MM-TT"), der im Kalender noch erhalten bleibt.
 */
export function findExpiredTasks(tasks: Task[], now: string, oldestKey: string): Task[] {
  const cutoff = new Date(now).getTime() - INBOX_DONE_KEEP_MS
  return tasks.filter((task) => {
    if (task.plannedDate === undefined) {
      return task.status === 'done' && new Date(task.doneAt ?? task.updatedAt).getTime() <= cutoff
    }
    const finished = task.status === 'done' || task.kind === 'event'
    return finished && task.plannedDate < oldestKey
  })
}

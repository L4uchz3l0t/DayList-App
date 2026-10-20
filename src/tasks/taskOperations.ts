import { createId } from './createId'
import type { Task, TaskPriority, TaskStatus } from './types'

/**
 * Alle Aufgaben-Aktionen als einfache Funktionen.
 * Sie verändern nichts direkt, sondern geben immer eine neue Liste zurück.
 * So lassen sie sich leicht testen, und die Oberfläche bleibt von der Logik getrennt.
 * `now` ist der aktuelle Zeitpunkt (ISO-Text) und wird für die Zeitstempel verwendet.
 */

/** Felder, die beim Bearbeiten geändert werden können. `undefined` löscht einen Wert. */
export interface TaskChanges {
  title?: string
  status?: TaskStatus
  plannedDate?: string | undefined
  dueDate?: string | undefined
  priority?: TaskPriority | undefined
  time?: string | undefined
  reminder?: number | undefined
}

/** Angaben für eine neue Aufgabe. Nur der Titel ist Pflicht. */
export interface NewTaskInput {
  title: string
  plannedDate?: string
  dueDate?: string
  priority?: TaskPriority
  time?: string
  reminder?: number
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
  if (input.plannedDate) task.plannedDate = input.plannedDate
  if (input.dueDate) task.dueDate = input.dueDate
  if (input.priority) task.priority = input.priority
  if (input.time) task.time = input.time
  if (input.reminder !== undefined) task.reminder = input.reminder
  return withRemindAt(task)
}

/** Ändert eine Aufgabe. Ein leerer Titel wird ignoriert, damit keine namenlosen Aufgaben entstehen. */
export function updateTask(tasks: Task[], id: string, changes: TaskChanges, now: string): Task[] {
  return tasks.map((task) => {
    if (task.id !== id) return task

    const updated: Task = { ...task, updatedAt: now }
    if (changes.title !== undefined && changes.title.trim() !== '') updated.title = changes.title.trim()
    if (changes.status !== undefined) updated.status = changes.status
    for (const key of ['plannedDate', 'dueDate', 'priority', 'time', 'reminder'] as const) {
      if (!(key in changes)) continue
      const value = changes[key]
      if (value === undefined || value === '') {
        delete updated[key]
      } else {
        // TypeScript weiß hier nicht, welcher der Schlüssel es ist, daher die Umwandlung
        ;(updated as unknown as Record<string, string | number>)[key] = value
      }
    }
    return withRemindAt(updated)
  })
}

/** Erledigt eine offene Aufgabe oder öffnet eine erledigte wieder. */
export function toggleTaskStatus(tasks: Task[], id: string, now: string): Task[] {
  const task = tasks.find((t) => t.id === id)
  if (!task) return tasks
  return updateTask(tasks, id, { status: task.status === 'done' ? 'open' : 'done' }, now)
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

import type { Task, TaskPriority } from '../tasks/types'
import { withRemindAt } from '../tasks/taskOperations'

/*
  Datensicherung als Datei: alle Aufgaben werden als JSON-Text gespeichert und können
  später wieder eingelesen werden. Beim Einlesen wird zusammengeführt, nichts gelöscht.
*/

const APP_NAME = 'DayList'
const BACKUP_VERSION = 1

export interface BackupFile {
  app: typeof APP_NAME
  version: number
  exportedAt: string
  tasks: Task[]
}

/** Die Datei ist keine gültige DayList-Sicherung */
export class InvalidBackupError extends Error {}

/** Baut den Inhalt einer Sicherungsdatei. */
export function createBackup(tasks: Task[], nowIso: string): string {
  const backup: BackupFile = { app: APP_NAME, version: BACKUP_VERSION, exportedAt: nowIso, tasks }
  return JSON.stringify(backup, null, 2)
}

/** Dateiname mit Datum, zum Beispiel daylist-sicherung-2026-10-20.json */
export function backupFileName(dateKey: string, prefix = 'daylist-sicherung'): string {
  return `${prefix}-${dateKey}.json`
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/
const TIME = /^\d{2}:\d{2}$/
const PRIORITIES: TaskPriority[] = ['low', 'normal', 'high']

/** Prüft eine einzelne Aufgabe aus der Datei und übernimmt nur bekannte Felder. */
function readTask(value: unknown): Task {
  if (typeof value !== 'object' || value === null) throw new InvalidBackupError('Aufgabe ist kein Objekt')
  const raw = value as Record<string, unknown>
  const isText = (key: string) => typeof raw[key] === 'string' && raw[key] !== ''
  if (!isText('id') || !isText('title') || !isText('createdAt') || !isText('updatedAt')) {
    throw new InvalidBackupError('Pflichtfeld fehlt')
  }
  if (raw.status !== 'open' && raw.status !== 'done') throw new InvalidBackupError('Unbekannter Status')
  const optionalDate = (key: 'plannedDate' | 'dueDate') => {
    if (raw[key] === undefined) return undefined
    if (typeof raw[key] !== 'string' || !DATE_KEY.test(raw[key])) throw new InvalidBackupError(`Ungültiges ${key}`)
    return raw[key]
  }
  if (raw.priority !== undefined && !PRIORITIES.includes(raw.priority as TaskPriority)) {
    throw new InvalidBackupError('Unbekannte Priorität')
  }

  const task: Task = {
    id: raw.id as string,
    title: raw.title as string,
    status: raw.status,
    createdAt: raw.createdAt as string,
    updatedAt: raw.updatedAt as string,
  }
  const plannedDate = optionalDate('plannedDate')
  const dueDate = optionalDate('dueDate')
  if (plannedDate) task.plannedDate = plannedDate
  if (dueDate) task.dueDate = dueDate
  if (raw.priority) task.priority = raw.priority as TaskPriority
  if (raw.kind === 'event') task.kind = 'event'
  if (raw.status === 'done' && typeof raw.doneAt === 'string' && !Number.isNaN(Date.parse(raw.doneAt))) {
    task.doneAt = raw.doneAt
  }
  // Uhrzeit und Erinnerung: Ungültiges wird still weggelassen, die Aufgabe bleibt erhalten
  if (typeof raw.time === 'string' && TIME.test(raw.time)) task.time = raw.time
  if (typeof raw.reminder === 'number' && Number.isInteger(raw.reminder) && raw.reminder >= 0) task.reminder = raw.reminder
  return withRemindAt(task)
}

/** Liest den Text einer Sicherungsdatei. Wirft InvalidBackupError, wenn es keine DayList-Sicherung ist. */
export function parseBackup(text: string): Task[] {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new InvalidBackupError('Kein JSON')
  }
  if (typeof data !== 'object' || data === null) throw new InvalidBackupError('Kein Objekt')
  const backup = data as Record<string, unknown>
  if (backup.app !== APP_NAME || !Array.isArray(backup.tasks)) throw new InvalidBackupError('Keine DayList-Sicherung')
  if (typeof backup.version !== 'number' || backup.version > BACKUP_VERSION) {
    throw new InvalidBackupError('Sicherung von einer neueren App-Version')
  }
  return backup.tasks.map(readTask)
}

export interface MergeResult {
  /** Alle Aufgaben nach dem Zusammenführen */
  tasks: Task[]
  /** Aufgaben, die gespeichert werden müssen (neu oder aktualisiert) */
  changed: Task[]
  added: number
  updated: number
}

/**
 * Führt eingelesene Aufgaben mit den vorhandenen zusammen.
 * Neue Aufgaben kommen dazu, bei gleicher ID gewinnt die zuletzt geänderte Fassung.
 * Vorhandene Aufgaben, die nicht in der Datei stehen, bleiben unverändert.
 */
export function mergeTasks(existing: Task[], incoming: Task[]): MergeResult {
  const byId = new Map(existing.map((task) => [task.id, task]))
  const changed: Task[] = []
  let added = 0
  let updated = 0
  for (const task of incoming) {
    const current = byId.get(task.id)
    if (!current) {
      added++
    } else if (task.updatedAt > current.updatedAt) {
      updated++
    } else {
      continue
    }
    byId.set(task.id, task)
    changed.push(task)
  }
  const tasks = [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return { tasks, changed, added, updated }
}

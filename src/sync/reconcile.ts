import type { Task } from '../tasks/types'

/*
  Abgleich zwischen den Aufgaben auf diesem Gerät und der Sicherung in der Cloud.
  Regel: Für jede Aufgabe gewinnt die zuletzt geänderte Fassung, egal auf welchem Gerät.
  Gelöschte Aufgaben bleiben in der Cloud als "gelöscht" markiert stehen, damit andere
  Geräte davon erfahren.
*/

/** Eine Zeile in der Cloud-Tabelle */
export interface RemoteRow {
  id: string
  /** Die Aufgabe, bei gelöschten Aufgaben leer */
  data: Task | null
  deleted: boolean
  /** Zeitpunkt der letzten Änderung oder Löschung (ISO) */
  updated_at: string
}

/** Auf diesem Gerät gelöschte Aufgaben, die die Cloud noch nicht kennt: ID → Löschzeitpunkt */
export type PendingDeletes = Record<string, string>

export interface ReconcileResult {
  /** Aufgaben auf diesem Gerät nach dem Abgleich */
  tasks: Task[]
  /** Aufgaben, die auf diesem Gerät neu gespeichert werden müssen */
  saveLocally: Task[]
  /** IDs, die auf diesem Gerät gelöscht werden müssen */
  removeLocally: string[]
  /** Zeilen, die in die Cloud geschrieben werden müssen */
  push: RemoteRow[]
}

/** Zeitpunkte vergleichen; die Cloud schreibt sie eventuell anders (+00:00 statt Z) */
const time = (iso: string) => new Date(iso).getTime()

const toRow = (task: Task): RemoteRow => ({ id: task.id, data: task, deleted: false, updated_at: task.updatedAt })

export function reconcile(local: Task[], remote: RemoteRow[], pendingDeletes: PendingDeletes): ReconcileResult {
  const localById = new Map(local.map((task) => [task.id, task]))
  const remoteById = new Map(remote.map((row) => [row.id, row]))
  const result = new Map(localById)
  const saveLocally: Task[] = []
  const removeLocally: string[] = []
  const push: RemoteRow[] = []

  // Aufgaben auf diesem Gerät
  for (const task of local) {
    const row = remoteById.get(task.id)
    if (!row) {
      push.push(toRow(task))
    } else if (time(task.updatedAt) > time(row.updated_at)) {
      // Hier neuer: auch eine anderswo gelöschte Aufgabe kommt so zurück, wenn sie danach hier geändert wurde
      push.push(toRow(task))
    } else if (time(row.updated_at) > time(task.updatedAt)) {
      if (row.deleted || !row.data) {
        result.delete(task.id)
        removeLocally.push(task.id)
      } else {
        result.set(task.id, row.data)
        saveLocally.push(row.data)
      }
    }
  }

  // Hier gelöschte Aufgaben an die Cloud melden, außer sie wurde anderswo danach noch geändert
  for (const [id, deletedAt] of Object.entries(pendingDeletes)) {
    if (localById.has(id)) continue
    const row = remoteById.get(id)
    if (row?.deleted) continue
    if (row?.data && time(row.updated_at) > time(deletedAt)) {
      result.set(id, row.data)
      saveLocally.push(row.data)
      continue
    }
    push.push({ id, data: null, deleted: true, updated_at: deletedAt })
  }

  // Aufgaben, die nur in der Cloud liegen (zum Beispiel vom anderen Gerät)
  for (const row of remote) {
    if (localById.has(row.id) || row.id in pendingDeletes || row.deleted || !row.data) continue
    result.set(row.id, row.data)
    saveLocally.push(row.data)
  }

  const tasks = [...result.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return { tasks, saveLocally, removeLocally, push }
}

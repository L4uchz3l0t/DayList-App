import { isCloudConfigured } from './cloudConfig'
import type { PendingDeletes } from './reconcile'

/*
  Merkt sich auf diesem Gerät gelöschte Aufgaben, bis die Cloud davon erfahren hat.
  So verschwinden sie auch auf den anderen Geräten, selbst wenn beim Löschen kein Internet da war.
*/

const STORAGE_KEY = 'pendingDeletes'

export function readPendingDeletes(): PendingDeletes {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as PendingDeletes) : {}
  } catch {
    return {}
  }
}

function write(pending: PendingDeletes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending))
  } catch {
    // Ohne Speicher erfährt die Cloud erst beim nächsten Löschen davon
  }
}

export function addPendingDelete(id: string, deletedAt: string) {
  if (!isCloudConfigured) return
  write({ ...readPendingDeletes(), [id]: deletedAt })
}

export function removePendingDeletes(ids: string[]) {
  const pending = readPendingDeletes()
  if (!ids.some((id) => id in pending)) return
  for (const id of ids) delete pending[id]
  write(pending)
}

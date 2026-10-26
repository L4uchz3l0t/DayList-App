import { isCloudConfigured } from './cloudConfig'
import type { PendingDeletes } from './reconcile'

/*
  Merkt sich auf diesem Gerät gelöschte Aufgaben, bis die Cloud davon erfahren hat.
  So verschwinden sie auch auf den anderen Geräten, selbst wenn beim Löschen kein Internet da war.
*/

const STORAGE_KEY = 'pendingDeletes'

/**
 * Nach so vielen Tagen wird eine nie abgeglichene Löschung vergessen (zum Beispiel ohne Anmeldung).
 * Genauso lange hebt die Cloud gelöschte Aufgaben auf (supabase/cleanup.sql).
 */
const KEEP_DAYS = 90

export function readPendingDeletes(): PendingDeletes {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as PendingDeletes) : {}
  } catch {
    return {}
  }
}

function write(pending: PendingDeletes) {
  const oldest = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000
  for (const [id, at] of Object.entries(pending)) {
    if (new Date(at).getTime() < oldest) delete pending[id]
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending))
  } catch {
    // Ohne Speicher erfährt die Cloud erst beim nächsten Löschen davon
  }
}

export function addPendingDelete(id: string, deletedAt: string) {
  addPendingDeletes([id], deletedAt)
}

export function addPendingDeletes(ids: string[], deletedAt: string) {
  if (!isCloudConfigured || ids.length === 0) return
  const pending = readPendingDeletes()
  for (const id of ids) pending[id] = deletedAt
  write(pending)
}

export function removePendingDeletes(ids: string[]) {
  const pending = readPendingDeletes()
  if (!ids.some((id) => id in pending)) return
  for (const id of ids) delete pending[id]
  write(pending)
}

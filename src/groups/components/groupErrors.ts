import type { Messages } from '../../i18n/messages'

/** Verständliche Meldung zu einem Fehler beim Ändern einer Gruppe */
export function describeGroupError(error: unknown, t: Messages): string {
  const { message, code } = (error ?? {}) as { message?: string; code?: string }
  if (message?.includes('mindestens einen Verwalter')) return t.groups.lastAdmin
  if (code === '23505') return t.groups.alreadyMember
  return message ? `${t.groups.failed} (${message})` : t.groups.failed
}

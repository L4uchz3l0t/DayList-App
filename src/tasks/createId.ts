/** Erzeugt eine eindeutige ID für eine neue Aufgabe. */
export function createId(): string {
  // randomUUID gibt es nur in "sicheren" Umgebungen (https oder localhost).
  // Beim Testen auf dem Handy über das Heimnetz fehlt es, daher die Ersatzlösung.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

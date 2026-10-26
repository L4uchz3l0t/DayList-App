/** Einstellung "In der Schnellaufnahme automatisch erkennen" (Standard: an), nur auf diesem Gerät */
const STORAGE_KEY = 'aiAutoDetect'

export function readAutoDetect(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

export function writeAutoDetect(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    // Ohne Speicher gilt die Wahl nur bis zum Neuladen
  }
}

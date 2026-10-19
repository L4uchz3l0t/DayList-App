export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

/**
 * Liest das gespeicherte Design und setzt es auf der Seite.
 * Ohne gespeicherte Wahl gilt die Einstellung des Geräts.
 */
export function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.dataset.theme = stored
      return stored
    }
  } catch {
    // Speicher nicht verfügbar (zum Beispiel im privaten Modus): Geräteeinstellung verwenden
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Setzt das Design und merkt sich die Wahl auf diesem Gerät. */
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Wahl gilt dann nur bis zum Neuladen
  }
}

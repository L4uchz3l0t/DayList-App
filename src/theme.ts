export type Theme = 'light' | 'dark'
/** Gewähltes Design: fest hell, fest dunkel oder wie das Gerät */
export type ThemePreference = Theme | 'system'

const STORAGE_KEY = 'theme'

/** Farbe der Statusleiste auf dem Handy, passend zum Hintergrund des Designs */
const THEME_COLORS: Record<Theme, string> = { light: '#f4f0e8', dark: '#121019' }

/** Liest die gespeicherte Wahl. Ohne gespeicherte Wahl gilt die Einstellung des Geräts. */
export function getThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Speicher nicht verfügbar (zum Beispiel im privaten Modus): Geräteeinstellung verwenden
  }
  return 'system'
}

/** Das tatsächlich sichtbare Design */
export function resolveTheme(preference: ThemePreference): Theme {
  if (preference !== 'system') return preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Setzt das Design auf der Seite und merkt sich die Wahl auf diesem Gerät. */
export function applyThemePreference(preference: ThemePreference) {
  const root = document.documentElement
  if (preference === 'system') delete root.dataset.theme
  else root.dataset.theme = preference
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[resolveTheme(preference)])
  try {
    if (preference === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, preference)
  } catch {
    // Wahl gilt dann nur bis zum Neuladen
  }
}

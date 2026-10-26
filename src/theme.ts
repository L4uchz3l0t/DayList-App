import { updateThemeColor } from './design'

export type Theme = 'light' | 'dark'
/** Gewähltes Design: fest hell, fest dunkel oder wie das Gerät */
export type ThemePreference = Theme | 'system'

const STORAGE_KEY = 'theme'


/** Liest die gespeicherte Wahl. Ohne gespeicherte Wahl ist die App hell. */
export function getThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // Speicher nicht verfügbar (zum Beispiel im privaten Modus): helles Design verwenden
  }
  return 'light'
}

/** Das tatsächlich sichtbare Design */
export function resolveTheme(preference: ThemePreference): Theme {
  if (preference !== 'system') return preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Setzt das Design auf der Seite und merkt sich die Wahl auf diesem Gerät. */
export function applyThemePreference(preference: ThemePreference) {
  const root = document.documentElement
  root.dataset.theme = preference
  // Tatsächlich sichtbar: hell oder dunkel (die Designs in styles/designs/ richten sich danach)
  root.dataset.mode = resolveTheme(preference)
  updateThemeColor()
  try {
    localStorage.setItem(STORAGE_KEY, preference)
  } catch {
    // Wahl gilt dann nur bis zum Neuladen
  }
}

/** Bei "Wie Gerät" dem Gerät folgen, wenn es zwischen hell und dunkel wechselt */
export function watchSystemTheme(onChange: () => void): () => void {
  const query = window.matchMedia('(prefers-color-scheme: dark)')
  const listener = () => {
    if (getThemePreference() !== 'system') return
    document.documentElement.dataset.mode = resolveTheme('system')
    updateThemeColor()
    onChange()
  }
  query.addEventListener('change', listener)
  return () => query.removeEventListener('change', listener)
}

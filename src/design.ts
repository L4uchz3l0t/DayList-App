/** Das Aussehen der App. Alle Designs haben dieselben Funktionen, nur Farben, Schrift und Formen ändern sich. */
export type DesignId = 'block' | 'fahrplan' | 'karoheft' | 'riso' | 'classic'

export const DESIGNS: DesignId[] = ['block', 'fahrplan', 'karoheft', 'riso', 'classic']

const STORAGE_KEY = 'design'

/** Standard ist der Abreißkalender */
export function getDesign(): DesignId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (DESIGNS.includes(stored as DesignId)) return stored as DesignId
  } catch {
    // Speicher nicht verfügbar: Standard verwenden
  }
  return 'block'
}

/** Setzt das Design auf der Seite (siehe styles/designs/) und merkt sich die Wahl auf diesem Gerät. */
export function applyDesign(design: DesignId) {
  document.documentElement.dataset.design = design
  try {
    localStorage.setItem(STORAGE_KEY, design)
  } catch {
    // Wahl gilt dann nur bis zum Neuladen
  }
  updateThemeColor()
}

/** Farbe der Statusleiste auf dem Handy: der Hintergrund des gerade sichtbaren Designs */
export function updateThemeColor() {
  const background = getComputedStyle(document.documentElement).getPropertyValue('--color-statusbar').trim()
  if (background) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', background)
}

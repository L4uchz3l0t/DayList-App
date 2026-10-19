import { useEffect, useState } from 'react'

/** So lange läuft die Ausblende-Animation von Fenstern und Meldungen (passt zu --duration-exit) */
export const EXIT_DURATION = 180

/**
 * Hält ein Fenster oder eine Meldung nach dem Schließen noch kurz sichtbar,
 * damit es sanft ausblenden kann statt schlagartig zu verschwinden.
 * `shown` ist der zuletzt sichtbare Wert, `closing` ist während des Ausblendens true.
 */
export function usePresence<T>(value: T | null) {
  const [state, setState] = useState<{ shown: T | null; closing: boolean }>({ shown: value, closing: false })

  // Neuer Wert: sofort zeigen. Wert weg: Ausblenden starten (Anpassung direkt beim Zeichnen, ohne Effekt).
  if (value !== null && (state.shown !== value || state.closing)) {
    setState({ shown: value, closing: false })
  } else if (value === null && state.shown !== null && !state.closing) {
    setState({ shown: state.shown, closing: true })
  }

  useEffect(() => {
    if (!state.closing) return
    const timer = window.setTimeout(() => setState({ shown: null, closing: false }), EXIT_DURATION)
    return () => window.clearTimeout(timer)
  }, [state.closing])

  return state
}

import { useRef, type TouchEvent } from 'react'

/** Mindestweg in Pixeln, ab dem eine Bewegung als Wischen zählt */
const MIN_DISTANCE = 50

/** Länger gedrückt ist kein Wischen mehr, sondern zum Beispiel Ziehen einer Aufgabe */
const MAX_DURATION = 700

/**
 * Breite des Randbereichs links und rechts (Anteil der Bildschirmbreite). Wischen, das hier beginnt,
 * wechselt im Kalender den Tab statt Monat oder Tag. Ganz außen am Rand liegt bei vielen Handys die
 * Zurück-Geste des Systems, deshalb ist der Bereich etwas breiter.
 */
const EDGE_SHARE = 0.15

export type SwipeStart = 'edge' | 'inner' | 'any'

/** Beginnt die Berührung am linken oder rechten Bildschirmrand? */
export function isEdgeTouch(x: number): boolean {
  const width = window.innerWidth
  return x < width * EDGE_SHARE || x > width * (1 - EDGE_SHARE)
}

/**
 * Waagerechtes Wischen mit dem Finger erkennen. Senkrechtes Scrollen bleibt unberührt,
 * weil nur eindeutig seitliche Bewegungen zählen.
 * `onNext`: nach links gewischt (wie Blättern zur nächsten Seite), `onPrevious`: nach rechts.
 * `start` legt fest, wo das Wischen beginnen muss: am Rand, innen oder egal.
 * Gibt die Handler zurück, die auf das Element gelegt werden.
 */
export function useSwipe(onNext: () => void, onPrevious: () => void, disabled = false, start: SwipeStart = 'any') {
  const from = useRef<{ x: number; y: number; at: number } | null>(null)

  return {
    onTouchStart(event: TouchEvent) {
      const touch = event.touches[0]
      const edge = isEdgeTouch(touch.clientX)
      const fits = start === 'any' || (start === 'edge') === edge
      // In Fenstern und Eingabefeldern wird nicht gewischt
      const target = event.target as HTMLElement
      const inside = target.closest('.sheet__backdrop, input, textarea, select')
      from.current =
        event.touches.length === 1 && fits && !inside ? { x: touch.clientX, y: touch.clientY, at: Date.now() } : null
    },
    onTouchEnd(event: TouchEvent) {
      const begin = from.current
      from.current = null
      if (!begin || disabled || Date.now() - begin.at > MAX_DURATION) return
      const touch = event.changedTouches[0]
      const dx = touch.clientX - begin.x
      const dy = touch.clientY - begin.y
      if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return
      if (dx < 0) onNext()
      else onPrevious()
    },
    onTouchCancel() {
      from.current = null
    },
  }
}

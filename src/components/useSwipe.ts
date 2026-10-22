import { useRef, type TouchEvent } from 'react'

/** Mindestweg in Pixeln, ab dem eine Bewegung als Wischen zählt */
const MIN_DISTANCE = 50

/**
 * Waagerechtes Wischen mit dem Finger erkennen. Senkrechtes Scrollen bleibt unberührt,
 * weil nur eindeutig seitliche Bewegungen zählen.
 * `onNext`: nach links gewischt (wie Blättern zur nächsten Seite), `onPrevious`: nach rechts.
 * Gibt die Handler zurück, die auf das Element gelegt werden.
 */
export function useSwipe(onNext: () => void, onPrevious: () => void, disabled = false) {
  const start = useRef<{ x: number; y: number } | null>(null)

  return {
    onTouchStart(event: TouchEvent) {
      const touch = event.touches[0]
      start.current = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null
    },
    onTouchEnd(event: TouchEvent) {
      const from = start.current
      start.current = null
      if (!from || disabled) return
      const touch = event.changedTouches[0]
      const dx = touch.clientX - from.x
      const dy = touch.clientY - from.y
      if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return
      if (dx < 0) onNext()
      else onPrevious()
    },
    onTouchCancel() {
      start.current = null
    },
  }
}

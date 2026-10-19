import { useEffect, useState } from 'react'
import { msUntilNextDay, toDateKey } from './tasks/dates'

/**
 * Das heutige Datum, das sich um Mitternacht von selbst weiterschaltet.
 * Zusätzlich wird beim Zurückkehren in die App geprüft, ob inzwischen ein neuer Tag ist
 * (Handys halten Zeitgeber im Hintergrund oft an).
 */
export function useToday(): Date {
  const [today, setToday] = useState(() => new Date())

  useEffect(() => {
    let timer: number | undefined

    function check() {
      const now = new Date()
      // Nur bei einem neuen Tag aktualisieren, sonst bliebe alles unnötig in Bewegung
      setToday((current) => (toDateKey(current) === toDateKey(now) ? current : now))
      window.clearTimeout(timer)
      // Eine Sekunde Puffer, damit der Zeitgeber sicher nach Mitternacht feuert
      timer = window.setTimeout(check, msUntilNextDay(now) + 1000)
    }

    function checkWhenVisible() {
      if (document.visibilityState === 'visible') check()
    }

    timer = window.setTimeout(check, msUntilNextDay(new Date()) + 1000)
    document.addEventListener('visibilitychange', checkWhenVisible)
    window.addEventListener('focus', check)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', checkWhenVisible)
      window.removeEventListener('focus', check)
    }
  }, [])

  return today
}

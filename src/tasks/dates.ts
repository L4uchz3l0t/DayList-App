/** Wandelt ein Datum in den Text "JJJJ-MM-TT" um, bezogen auf die lokale Zeitzone. */
export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Gibt ein neues Datum zurück, das `days` Tage später (oder früher bei negativen Werten) liegt. */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/** Zum Beispiel "Montag, 19. Oktober" */
export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}

/** Wandelt den Text "JJJJ-MM-TT" zurück in ein Datum (Mitternacht, lokale Zeitzone). */
export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Zum Beispiel "17. Okt." */
export function formatShortDate(dateKey: string): string {
  return new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short' }).format(parseDateKey(dateKey))
}

/**
 * Alle Tage eines Monats für eine Kalenderansicht, Woche beginnt am Montag.
 * Leere Felder vor dem 1. des Monats sind `null`. `month` zählt ab 0 (Januar = 0).
 */
export function getMonthGrid(year: number, month: number): (string | null)[] {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7 // Montag = 0 ... Sonntag = 6
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const grid: (string | null)[] = Array.from({ length: firstWeekday }, () => null)
  for (let day = 1; day <= daysInMonth; day++) {
    grid.push(toDateKey(new Date(year, month, day)))
  }
  return grid
}

/** Zum Beispiel "Mo., 19. Okt. 2026" */
export function formatFullDate(dateKey: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parseDateKey(dateKey))
}

/** Zum Beispiel "Mi., 21. Okt." */
export function formatWeekdayDate(dateKey: string): string {
  return new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }).format(
    parseDateKey(dateKey),
  )
}

/** Zum Beispiel "Mittwoch" */
export function formatWeekday(dateKey: string): string {
  return new Intl.DateTimeFormat('de-DE', { weekday: 'long' }).format(parseDateKey(dateKey))
}

/** Millisekunden bis zum nächsten Mitternacht (lokale Zeit, auch an Tagen mit Zeitumstellung). */
export function msUntilNextDay(now: Date): number {
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return nextMidnight.getTime() - now.getTime()
}

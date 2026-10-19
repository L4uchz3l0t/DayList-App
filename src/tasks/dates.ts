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

/** Anzahl der Kalendertage von `fromKey` bis `toKey` (negativ, wenn `toKey` früher liegt). */
export function daysBetween(fromKey: string, toKey: string): number {
  const msPerDay = 24 * 60 * 60 * 1000
  // Runden gleicht Sommer- und Winterzeit aus (Tage mit 23 oder 25 Stunden)
  return Math.round((parseDateKey(toKey).getTime() - parseDateKey(fromKey).getTime()) / msPerDay)
}

/** Gut lesbare Tagesangabe: "Heute", "Gestern", "Morgen" oder zum Beispiel "Sa., 17. Okt." */
export function formatDayLabel(dateKey: string, todayKey: string): string {
  const offset = daysBetween(todayKey, dateKey)
  if (offset === 0) return 'Heute'
  if (offset === -1) return 'Gestern'
  if (offset === 1) return 'Morgen'
  return new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }).format(
    parseDateKey(dateKey),
  )
}

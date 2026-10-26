import { addDays, parseDateKey, toDateKey } from '../tasks/dates'
import type { BusySlot, ClassifyResult, PlanWeekRequest, PlanWeekResult, Proposal } from './types'

/*
  Die einfache "KI" ohne Sprachmodell: feste Regeln, die sofort und ohne Internet auf dem Gerät laufen.
  Sie antworten genau wie eine richtige KI (siehe types.ts). Eine eigene KI kann sie Schritt für Schritt ersetzen.
*/

/** Wörter, bei denen etwas eher ein Termin als eine Aufgabe ist */
const EVENT_WORDS = [
  'termin', 'arzt', 'ärztin', 'zahnarzt', 'friseur', 'treffen', 'meeting', 'besprechung', 'vorlesung', 'seminar',
  'übung', 'tutorium', 'klausur', 'prüfung', 'kino', 'konzert', 'party', 'geburtstag', 'training', 'probe',
  'interview', 'vorstellungsgespräch', 'date', 'call', 'abendessen', 'mittagessen', 'frühstück mit', 'essen mit',
  'flug', 'zug nach', 'abfahrt', 'appointment', 'doctor', 'dentist', 'lecture', 'exam', 'dinner', 'lunch with',
]

const WEEKDAYS: Record<string, number> = {
  sonntag: 0, montag: 1, dienstag: 2, mittwoch: 3, donnerstag: 4, freitag: 5, samstag: 6,
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
}

const pad = (value: number) => String(value).padStart(2, '0')

/** Ganzes Wort: \b kennt keine Umlaute, deshalb eigene Grenzen (kein Buchstabe und keine Ziffer davor oder danach) */
const word = (pattern: string) => new RegExp(`(?<![\\p{L}\\d])${pattern}(?![\\p{L}\\d])`, 'u')

/** Ein erkannter Teil des Textes, der danach aus dem Titel verschwindet */
interface Match {
  start: number
  end: number
}

function findDate(lower: string, todayKey: string): { date: string; match: Match } | null {
  const today = parseDateKey(todayKey)
  const relative: [RegExp, number][] = [
    [word('(?:am\\s+|on\\s+)?übermorgen'), 2],
    [word('(?:the\\s+)?day after tomorrow'), 2],
    [word('(?:am\\s+)?morgen'), 1],
    [word('tomorrow'), 1],
    [word('(?:heute|today)'), 0],
  ]
  for (const [pattern, days] of relative) {
    const found = pattern.exec(lower)
    if (found) return { date: toDateKey(addDays(today, days)), match: { start: found.index, end: found.index + found[0].length } }
  }

  const weekday = word(
    '(?:am\\s+|on\\s+)?(?:nächsten\\s+|next\\s+)?(sonntag|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sunday|monday|tuesday|wednesday|thursday|friday|saturday)',
  ).exec(lower)
  if (weekday) {
    // Der nächste solche Tag; am gleichen Wochentag ist die Woche darauf gemeint
    const ahead = (WEEKDAYS[weekday[1]] - today.getDay() + 7) % 7 || 7
    return { date: toDateKey(addDays(today, ahead)), match: { start: weekday.index, end: weekday.index + weekday[0].length } }
  }

  // 27.10. oder 27.10.2026
  const numeric = /\b(?:am\s+|on\s+)?(\d{1,2})\.(\d{1,2})\.(\d{4}|\d{2})?/.exec(lower)
  if (numeric) {
    const day = Number(numeric[1])
    const month = Number(numeric[2])
    let year = numeric[3] ? Number(numeric[3]) : today.getFullYear()
    if (year < 100) year += 2000
    const date = new Date(year, month - 1, day)
    if (date.getMonth() === month - 1 && date.getDate() === day) {
      // Ohne Jahr und schon vorbei: nächstes Jahr
      if (!numeric[3] && date < today) date.setFullYear(year + 1)
      return { date: toDateKey(date), match: { start: numeric.index, end: numeric.index + numeric[0].length } }
    }
  }
  return null
}

function findTime(lower: string): { time: string; match: Match } | null {
  const patterns: RegExp[] = [
    // 14:30, 14.30, um 14:30 Uhr
    /\b(?:um\s+|at\s+|ab\s+)?(\d{1,2})[:.](\d{2})(?:\s*uhr)?\b/,
    // um 14 Uhr, 14 uhr
    /\b(?:um\s+|ab\s+)?(\d{1,2})\s*uhr\b/,
    // 3pm, 3:30 pm
    /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/,
  ]
  for (const pattern of patterns) {
    const found = pattern.exec(lower)
    if (!found) continue
    let hours = Number(found[1])
    const minutes = found[2] ? Number(found[2]) : 0
    if (found[3] === 'pm' && hours < 12) hours += 12
    if (found[3] === 'am' && hours === 12) hours = 0
    if (hours > 23 || minutes > 59) continue
    return { time: `${pad(hours)}:${pad(minutes)}`, match: { start: found.index, end: found.index + found[0].length } }
  }
  return null
}

/** Dauer wie "3 Stunden", "90 min", "1,5 h" in Minuten */
export function findDuration(lower: string): { minutes: number; match: Match } | null {
  const hours = /\b(\d+(?:[.,]\d+)?)\s*(?:stunden|stunde|std\.?|h|hours?)(?=\s|$|[,.;])/.exec(lower)
  if (hours) {
    const minutes = Math.round(Number(hours[1].replace(',', '.')) * 60)
    if (minutes > 0) return { minutes, match: { start: hours.index, end: hours.index + hours[0].length } }
  }
  const mins = /\b(\d+)\s*(?:minuten|min\.?|minutes?)(?=\s|$|[,.;])/.exec(lower)
  if (mins && Number(mins[1]) > 0) {
    return { minutes: Number(mins[1]), match: { start: mins.index, end: mins.index + mins[0].length } }
  }
  return null
}

/** Schneidet die erkannten Teile aus dem Text und räumt Füllwörter am Rand weg */
function cleanTitle(text: string, matches: Match[]): string {
  let result = text
  for (const match of [...matches].sort((a, b) => b.start - a.start)) {
    result = result.slice(0, match.start) + ' ' + result.slice(match.end)
  }
  result = result
    .replace(/\s+/g, ' ')
    .replace(/^(?:\s|[,;:-]|(?:für|for|und|and|am|um|on|at)(?=\s|$))+/i, '')
    .replace(/(?:\s|[,;:-]|(?<=\s|^)(?:um|am|at|on|und|and))+$/i, '')
    .trim()
  return result === '' ? text.trim() : result.charAt(0).toUpperCase() + result.slice(1)
}

/** Aufgabe oder Termin? Erkennt dazu Tag und Uhrzeit im Text. */
export function classifyText(text: string, todayKey: string): ClassifyResult {
  // Kleinbuchstaben ändern die Länge deutscher Texte nicht, die Positionen passen also auch zum Original
  const lower = text.toLowerCase()
  const date = findDate(lower, todayKey)
  // Das Datum zuerst herausnehmen, damit "12.10." nicht als Uhrzeit 12:10 gilt
  const withoutDate = date
    ? lower.slice(0, date.match.start) + ' '.repeat(date.match.end - date.match.start) + lower.slice(date.match.end)
    : lower
  const time = findTime(withoutDate)
  const hasEventWord = EVENT_WORDS.some((word) => new RegExp(`(^|[^\\p{L}])${word}($|[^\\p{L}])`, 'u').test(lower))
  const result: ClassifyResult = {
    kind: time || hasEventWord ? 'event' : 'task',
    title: cleanTitle(text, [date?.match, time?.match].filter((match): match is Match => match !== undefined)),
  }
  if (date) result.date = date.date
  if (time) result.time = time.time
  return result
}

/* ---------- Woche planen ---------- */

const DAY_START = 9 * 60
const DAY_END = 20 * 60
/** Längere Vorhaben werden in Stücke dieser Länge auf mehrere Tage verteilt */
const MAX_BLOCK = 120
/** Pause nach einem Termin, bevor etwas Neues beginnt */
const BUFFER = 15
const DAYS_AHEAD = 7

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}
const toTime = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`

interface Interval {
  from: number
  to: number
}

const TEXT = {
  de: {
    asGiven: 'Wie angegeben',
    free: (from: string, to: string) => `Frei von ${from} bis ${to}`,
    quietDay: 'Ruhigster Tag der Woche',
    split: (title: string, parts: number) => `Ich habe „${title}“ auf ${parts} Tage verteilt. Passt das so?`,
    noRoom: (titles: string) => `Für ${titles} war in den nächsten 7 Tagen keine freie Zeit. Soll das in die Woche danach?`,
    nothing: 'Ich habe nichts erkannt. Schreib die Vorhaben mit Komma getrennt, zum Beispiel: Wäsche, 2 Stunden lernen.',
  },
  en: {
    asGiven: 'As you said',
    free: (from: string, to: string) => `Free from ${from} to ${to}`,
    quietDay: 'Quietest day of the week',
    split: (title: string, parts: number) => `I spread “${title}” over ${parts} days. Does that work?`,
    noRoom: (titles: string) => `There was no free time for ${titles} in the next 7 days. Move it to the week after?`,
    nothing: 'I could not find anything. Separate your plans with commas, for example: laundry, study 2 hours.',
  },
}

/**
 * Verteilt Vorhaben auf die nächsten 7 Tage. Was eine Dauer hat, bekommt eine freie Zeit im Kalender
 * (zwischen 9 und 20 Uhr, mit Pause nach Terminen), alles andere landet als Aufgabe am ruhigsten Tag.
 * Es sind nur Vorschläge; eingetragen wird erst, wenn du sie bestätigst.
 */
export function planWeekWithRules(request: PlanWeekRequest, language: 'de' | 'en' = 'de'): PlanWeekResult {
  const text = TEXT[language]
  const today = parseDateKey(request.today)
  const days = Array.from({ length: DAYS_AHEAD }, (_, index) => toDateKey(addDays(today, index + 1)))

  // Belegte Zeiten und Anzahl der Einträge je Tag
  const taken = new Map<string, Interval[]>(days.map((day) => [day, []]))
  const load = new Map<string, number>(days.map((day) => [day, 0]))
  const occupy = (date: string, from: number, to: number) => {
    taken.get(date)?.push({ from, to })
    load.set(date, (load.get(date) ?? 0) + 1)
  }
  for (const slot of request.busy) addBusy(slot)
  function addBusy(slot: BusySlot) {
    if (!taken.has(slot.date)) return
    if (!slot.from) {
      load.set(slot.date, (load.get(slot.date) ?? 0) + 1)
      return
    }
    occupy(slot.date, toMinutes(slot.from), slot.to ? toMinutes(slot.to) : toMinutes(slot.from) + 60)
  }

  /** Frühester freier Zeitraum an einem Tag, oder null */
  function freeSlot(date: string, minutes: number): Interval | null {
    const intervals = [...(taken.get(date) ?? [])].sort((a, b) => a.from - b.from)
    let start = DAY_START
    for (const interval of intervals) {
      if (interval.from - start >= minutes) break
      start = Math.max(start, interval.to + BUFFER)
    }
    if (start + minutes > DAY_END) return null
    const next = intervals.find((interval) => interval.from >= start + minutes)
    return { from: start, to: next ? next.from : DAY_END }
  }

  const quietestDay = (exclude: Set<string> = new Set()) =>
    days.filter((day) => !exclude.has(day)).sort((a, b) => (load.get(a) ?? 0) - (load.get(b) ?? 0))[0]

  const proposals: Proposal[] = []
  const questions: string[] = []
  const noRoom: string[] = []

  const items = request.wishes
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter((item) => item !== '')

  for (const item of items) {
    const lower = item.toLowerCase()
    const duration = findDuration(lower)
    const textWithoutDuration = duration
      ? item.slice(0, duration.match.start) + ' '.repeat(duration.match.end - duration.match.start) + item.slice(duration.match.end)
      : item
    const parsed = classifyText(textWithoutDuration, request.today)
    const title = parsed.title

    // Tag und Uhrzeit selbst angegeben: genau so übernehmen
    if (parsed.date && parsed.time) {
      const proposal: Proposal = { title, kind: 'event', date: parsed.date, time: parsed.time, reason: text.asGiven }
      if (duration) proposal.durationMinutes = duration.minutes
      proposals.push(proposal)
      if (taken.has(parsed.date)) occupy(parsed.date, toMinutes(parsed.time), toMinutes(parsed.time) + (duration?.minutes ?? 60))
      continue
    }

    // Mit Dauer oder als Termin ohne Uhrzeit: freie Zeit suchen, Längeres auf mehrere Tage verteilen
    if (duration || parsed.kind === 'event') {
      let rest = duration?.minutes ?? 60
      const parts = Math.ceil(rest / MAX_BLOCK)
      const block = Math.ceil(rest / parts / 15) * 15
      const used = new Set<string>()
      const candidates = parsed.date ? [parsed.date] : days
      let placed = 0
      while (rest > 0) {
        const minutes = Math.min(block, rest)
        const day = [...candidates]
          .filter((candidate) => !used.has(candidate) || candidates.length === 1)
          .sort((a, b) => (load.get(a) ?? 0) - (load.get(b) ?? 0))
          .find((candidate) => freeSlot(candidate, minutes))
        if (!day) break
        const slot = freeSlot(day, minutes)!
        proposals.push({
          title,
          kind: 'event',
          date: day,
          time: toTime(slot.from),
          durationMinutes: minutes,
          reason: text.free(toTime(slot.from), toTime(slot.to)),
        })
        occupy(day, slot.from, slot.from + minutes)
        used.add(day)
        rest -= minutes
        placed += 1
      }
      if (rest > 0) noRoom.push(`„${title}“`)
      else if (placed > 1) questions.push(text.split(title, placed))
      continue
    }

    // Aufgabe: am angegebenen Tag oder am ruhigsten Tag
    const day = parsed.date ?? quietestDay()
    proposals.push({ title, kind: 'task', date: day, reason: parsed.date ? text.asGiven : text.quietDay })
    load.set(day, (load.get(day) ?? 0) + 1)
  }

  if (noRoom.length > 0) questions.push(text.noRoom(noRoom.join(', ')))
  if (items.length === 0) questions.push(text.nothing)
  const result: PlanWeekResult = { proposals }
  if (questions.length > 0) result.question = questions.join(' ')
  return result
}

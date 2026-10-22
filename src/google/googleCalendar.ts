import { FunctionsHttpError } from '@supabase/supabase-js'
import { getSupabase } from '../sync/supabaseClient'
import { addDays, parseDateKey, toDateKey } from '../tasks/dates'
import type { Task } from '../tasks/types'

/*
  Termine aus dem Google Kalender (nur lesen). Die Verbindung zu Google hält der Dienst
  "google-calendar" in Supabase (supabase/functions/google-calendar); die App bekommt nur die Termine.
*/

const FUNCTION_NAME = 'google-calendar'

/** Mehrtägige ganztägige Termine erscheinen höchstens an so vielen Tagen */
const MAX_DAYS_PER_EVENT = 31

export interface GoogleCalendarInfo {
  id: string
  name: string
  color: string
  shown: boolean
}

export interface GoogleEvent {
  id: string
  title: string
  start: { date?: string; dateTime?: string }
  end: { date?: string; dateTime?: string }
  location?: string
  link?: string
  calendar: string
  color: string
}

export interface GoogleSync {
  connected: boolean
  email?: string | null
  calendars?: GoogleCalendarInfo[]
  events?: GoogleEvent[]
}

/** Bekannte Antworten des Dienstes, siehe KnownError dort; 'missing' = Dienst noch nicht angelegt */
export type GoogleErrorCode = 'not-configured' | 'missing' | 'not-signed-in' | 'not-connected' | 'expired' | 'other'

export class GoogleCalendarError extends Error {
  code: GoogleErrorCode

  constructor(code: GoogleErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const supabase = await getSupabase()
  if (!supabase) throw new GoogleCalendarError('not-configured', 'Cloud nicht eingerichtet')
  const { data, error } = await supabase.functions.invoke<T>(FUNCTION_NAME, { body })
  if (!error) return data as T
  if (error instanceof FunctionsHttpError) {
    const response = error.context as Response
    const answer = (await response.json().catch(() => ({}))) as { error?: string }
    if (response.status === 404 && !answer.error) throw new GoogleCalendarError('missing', 'Dienst fehlt')
    const known = ['not-configured', 'not-signed-in', 'not-connected', 'expired'] as const
    const code = known.find((candidate) => candidate === answer.error) ?? 'other'
    throw new GoogleCalendarError(code, answer.error ?? error.message)
  }
  throw new GoogleCalendarError('other', error.message)
}

/** Zeitraum, der abgeholt wird: zwei Monate zurück bis vier Monate voraus */
export function syncRange(todayKey: string): { from: string; to: string } {
  const today = parseDateKey(todayKey)
  const from = new Date(today.getFullYear(), today.getMonth() - 2, 1)
  const to = new Date(today.getFullYear(), today.getMonth() + 5, 1)
  return { from: from.toISOString(), to: to.toISOString() }
}

export function syncGoogle(todayKey: string): Promise<GoogleSync> {
  let timeZone = ''
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    // Ohne Zeitzone nimmt Google die des Kalenders
  }
  return call<GoogleSync>({ action: 'sync', ...syncRange(todayKey), timeZone })
}

/** Startet die Anmeldung bei Google: die App wechselt zu Google und kommt danach mit ?google=… zurück */
export async function connectGoogle(): Promise<void> {
  const returnTo = window.location.origin + window.location.pathname
  const { url } = await call<{ url: string }>({ action: 'start', returnTo })
  window.location.assign(url)
}

export function selectGoogleCalendars(calendars: string[]): Promise<unknown> {
  return call({ action: 'select', calendars })
}

export function disconnectGoogle(): Promise<unknown> {
  return call({ action: 'disconnect' })
}

const pad = (value: number) => String(value).padStart(2, '0')
const timeOf = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`

/**
 * Google-Termine als Termine für Heute und den Kalender (in der Zeitzone dieses Geräts).
 * Ganztägige Termine über mehrere Tage erscheinen an jedem dieser Tage.
 */
export function toEventTasks(events: GoogleEvent[]): Task[] {
  const result: Task[] = []
  for (const event of events) {
    const base = {
      title: event.title,
      status: 'open' as const,
      kind: 'event' as const,
      createdAt: '',
      updatedAt: '',
    }
    const google = {
      link: event.link ?? 'https://calendar.google.com',
      calendar: event.calendar,
      location: event.location,
    }
    if (event.start.dateTime) {
      const start = new Date(event.start.dateTime)
      const end = event.end.dateTime ? new Date(event.end.dateTime) : start
      const sameDay = toDateKey(start) === toDateKey(end)
      result.push({
        ...base,
        id: `google:${event.id}`,
        plannedDate: toDateKey(start),
        time: timeOf(start),
        google: { ...google, ...(sameDay && end > start ? { endTime: timeOf(end) } : {}) },
      })
    } else if (event.start.date) {
      // Bei ganztägigen Terminen ist das Ende der Tag danach
      const first = parseDateKey(event.start.date)
      const endKey = event.end.date ?? toDateKey(addDays(first, 1))
      for (let day = 0; day < MAX_DAYS_PER_EVENT; day++) {
        const key = toDateKey(addDays(first, day))
        if (day > 0 && key >= endKey) break
        result.push({ ...base, id: `google:${event.id}:${key}`, plannedDate: key, google })
      }
    }
  }
  return result
}

export const isGoogleEventId = (id: string) => id.startsWith('google:')

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  disconnectGoogle,
  GoogleCalendarError,
  selectGoogleCalendars,
  syncGoogle,
  toEventTasks,
  type GoogleCalendarInfo,
  type GoogleEvent,
} from './googleCalendar'
import type { Task } from '../tasks/types'

/*
  Hält die Google-Termine aktuell: beim Start, bei jeder Rückkehr in die App und alle 15 Minuten.
  Der letzte Stand liegt zusätzlich im Browser, damit Termine auch ohne Internet sichtbar bleiben.
*/

const CACHE_KEY = 'googleCalendarCache'
const POLL_INTERVAL = 15 * 60 * 1000

/**
 * - signed-out:    nicht bei der automatischen Sicherung angemeldet
 * - not-set-up:    der Dienst ist in Supabase noch nicht eingerichtet
 * - not-connected: eingerichtet, aber kein Google-Konto verbunden
 * - expired:       Google hat den Zugang zurückgezogen, neu verbinden
 */
export type GoogleStatus = 'signed-out' | 'loading' | 'not-set-up' | 'not-connected' | 'connected' | 'expired' | 'error'

interface Cache {
  account: string
  email: string | null
  calendars: GoogleCalendarInfo[]
  events: GoogleEvent[]
}

function readCache(account: string | null): Cache | null {
  if (!account) return null
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as Cache | null
    return cached?.account === account ? cached : null
  } catch {
    return null
  }
}

export interface GoogleCalendarData {
  status: GoogleStatus
  /** Verbundenes Google-Konto */
  email: string | null
  calendars: GoogleCalendarInfo[]
  /** Termine als Einträge für Heute und den Kalender */
  events: Task[]
  /** Letzter Fehler bei 'error', zum Weitergeben an den Nutzer */
  errorText: string | null
  reload: () => Promise<void>
  select: (calendarIds: string[]) => Promise<void>
  disconnect: () => Promise<void>
}

export function useGoogleCalendar(accountEmail: string | null, todayKey: string): GoogleCalendarData {
  const account = accountEmail?.toLowerCase() ?? null
  const [cache, setCache] = useState<Cache | null>(() => readCache(account))
  const [status, setStatus] = useState<GoogleStatus>(
    account ? (readCache(account) ? 'connected' : 'loading') : 'signed-out',
  )
  const [errorText, setErrorText] = useState<string | null>(null)
  const loadedFor = useRef(account)

  // Anderes DayList-Konto: alten Stand verwerfen
  if (loadedFor.current !== account) {
    loadedFor.current = account
    setCache(readCache(account))
    setStatus(account ? 'loading' : 'signed-out')
  }

  const store = useCallback((next: Cache | null) => {
    setCache(next)
    try {
      if (next) localStorage.setItem(CACHE_KEY, JSON.stringify(next))
      else localStorage.removeItem(CACHE_KEY)
    } catch {
      // Ohne Zwischenspeicher fehlen die Termine nur ohne Internet
    }
  }, [])

  const handleError = useCallback(
    (error: unknown) => {
      const code = error instanceof GoogleCalendarError ? error.code : 'other'
      if (code === 'not-configured' || code === 'missing') {
        setStatus('not-set-up')
      } else if (code === 'expired' || code === 'not-connected') {
        store(null)
        setStatus(code === 'expired' ? 'expired' : 'not-connected')
      } else {
        console.error('Google Kalender', error)
        setErrorText((error as Error)?.message ?? String(error))
        setStatus('error')
      }
    },
    [store],
  )

  const reload = useCallback(async () => {
    if (!account || !navigator.onLine) return
    try {
      const result = await syncGoogle(todayKey)
      if (!result.connected) {
        store(null)
        setStatus('not-connected')
        return
      }
      store({ account, email: result.email ?? null, calendars: result.calendars ?? [], events: result.events ?? [] })
      setErrorText(null)
      setStatus('connected')
    } catch (error) {
      handleError(error)
    }
  }, [account, todayKey, store, handleError])

  useEffect(() => {
    if (!account) return
    const timer = window.setTimeout(() => void reload(), 0)
    const whenVisible = () => {
      if (document.visibilityState === 'visible') void reload()
    }
    document.addEventListener('visibilitychange', whenVisible)
    window.addEventListener('online', whenVisible)
    const interval = window.setInterval(whenVisible, POLL_INTERVAL)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', whenVisible)
      window.removeEventListener('online', whenVisible)
      window.clearInterval(interval)
    }
  }, [account, reload])

  const select = useCallback(
    async (calendarIds: string[]) => {
      await selectGoogleCalendars(calendarIds)
      await reload()
    },
    [reload],
  )

  const disconnect = useCallback(async () => {
    await disconnectGoogle()
    store(null)
    setStatus('not-connected')
  }, [store])

  const events = useMemo(() => (account && cache ? toEventTasks(cache.events) : []), [account, cache])

  return {
    status: account ? status : 'signed-out',
    email: cache?.email ?? null,
    calendars: cache?.calendars ?? [],
    events,
    errorText,
    reload,
    select,
    disconnect,
  }
}

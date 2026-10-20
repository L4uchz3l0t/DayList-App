import { useCallback, useEffect, useRef, useState } from 'react'
import type { EmailOtpType, Session } from '@supabase/supabase-js'
import type { Task } from '../tasks/types'
import { isCloudConfigured } from './cloudConfig'
import { fetchRemoteRows, pushRows } from './cloudStore'
import { readPendingDeletes, removePendingDeletes } from './pendingDeletes'
import { reconcile, type ReconcileResult } from './reconcile'
import { getSupabase } from './supabaseClient'

/*
  Automatische Sicherung: Ist man angemeldet, gleicht die App ihre Aufgaben mit der Cloud ab,
  beim Start, bei jeder Rückkehr in die App, kurz nach jeder Änderung und alle paar Minuten.
  Ohne Internet wird später nachgeholt; die App selbst funktioniert immer auch ohne Cloud.
*/

/** Kurz warten, damit mehrere schnelle Änderungen in einem Rutsch gesichert werden */
const CHANGE_DELAY = 1500
/** Regelmäßig nachsehen, ob ein anderes Gerät etwas geändert hat */
const POLL_INTERVAL = 5 * 60 * 1000
const LAST_SYNC_KEY = 'lastCloudSync'

export type SyncState = 'idle' | 'syncing' | 'offline' | 'error'

export interface CloudSync {
  /** Zugangsdaten vorhanden: die Funktion wird in den Optionen angeboten */
  available: boolean
  /** E-Mail-Adresse des angemeldeten Kontos, sonst null */
  email: string | null
  syncState: SyncState
  /** Zeitpunkt des letzten erfolgreichen Abgleichs (ISO) */
  lastSyncedAt: string | null
  sendCode: (email: string) => Promise<void>
  verifyCode: (email: string, code: string) => Promise<void>
  signOut: () => Promise<void>
  syncNow: () => void
}

/** Liest Schlüssel und Art aus einem Anmeldelink von Supabase (…/auth/v1/verify?token=…&type=magiclink). */
export function readEmailLink(text: string): { tokenHash: string; type: EmailOtpType } | null {
  let url: URL
  try {
    url = new URL(text.trim())
  } catch {
    return null
  }
  const tokenHash = url.searchParams.get('token') ?? url.searchParams.get('token_hash')
  const type = url.searchParams.get('type')
  const types: EmailOtpType[] = ['magiclink', 'signup', 'email', 'invite', 'recovery', 'email_change']
  if (!tokenHash || !types.includes(type as EmailOtpType)) return null
  return { tokenHash, type: type as EmailOtpType }
}

function readLastSync(): string | null {
  try {
    return localStorage.getItem(LAST_SYNC_KEY)
  } catch {
    return null
  }
}

export function useCloudSync(
  tasks: Task[],
  ready: boolean,
  getTasks: () => Task[],
  applySync: (result: ReconcileResult) => void,
): CloudSync {
  const [session, setSession] = useState<Session | null>(null)
  const [syncState, setSyncState] = useState<SyncState>('idle')
  const [lastSyncedAt, setLastSyncedAt] = useState(readLastSync)

  // Läuft gerade ein Abgleich, wird ein weiterer danach nachgeholt statt gleichzeitig zu laufen
  const running = useRef(false)
  const again = useRef(false)
  // Die Liste, die der letzte Abgleich hinterlassen hat: deren Änderung ist keine neue Änderung
  const syncedTasks = useRef<Task[] | null>(null)

  const userId = session?.user.id ?? null

  const sync = useCallback(async () => {
    const client = getSupabase()
    if (!client || !userId || !ready) return
    if (running.current) {
      again.current = true
      return
    }
    if (!navigator.onLine) {
      setSyncState('offline')
      return
    }
    running.current = true
    setSyncState('syncing')
    try {
      const supabase = await client
      const remote = await fetchRemoteRows(supabase)
      const pending = readPendingDeletes()
      const result = reconcile(getTasks(), remote, pending)
      applySync(result)
      syncedTasks.current = getTasks()
      if (result.push.length > 0) await pushRows(supabase, userId, result.push)
      removePendingDeletes(Object.keys(pending))
      const now = new Date().toISOString()
      try {
        localStorage.setItem(LAST_SYNC_KEY, now)
      } catch {
        // Nur die Anzeige "zuletzt gesichert" geht verloren
      }
      setLastSyncedAt(now)
      setSyncState('idle')
    } catch (error) {
      console.error('Cloud-Abgleich fehlgeschlagen', error)
      setSyncState(navigator.onLine ? 'error' : 'offline')
    } finally {
      running.current = false
      if (again.current) {
        again.current = false
        void syncRef.current()
      }
    }
  }, [userId, ready, getTasks, applySync])

  // Für den nachgeholten Abgleich die jeweils aktuelle Fassung von sync aufrufen
  const syncRef = useRef(sync)
  useEffect(() => {
    syncRef.current = sync
  })

  // Anmeldung beim Start lesen und Änderungen (Anmelden, Abmelden, Link aus der E-Mail) verfolgen
  useEffect(() => {
    const client = getSupabase()
    if (!client) return
    let unsubscribe = () => {}
    let cancelled = false
    void client.then((supabase) => {
      if (cancelled) return
      void supabase.auth.getSession().then(({ data }) => {
        if (!cancelled) setSession(data.session)
      })
      const { data } = supabase.auth.onAuthStateChange((_event, next) => {
        if (!cancelled) setSession(next)
      })
      // Der Anmeldelink aus der E-Mail öffnet sich oft in einem Browser-Tab statt in der App.
      // Die Anmeldung landet trotzdem im gemeinsamen Speicher; bei Rückkehr in die App nachsehen.
      const recheck = () => {
        if (document.visibilityState !== 'visible') return
        void supabase.auth.getSession().then(({ data: current }) => {
          if (!cancelled) setSession(current.session)
        })
      }
      document.addEventListener('visibilitychange', recheck)
      unsubscribe = () => {
        data.subscription.unsubscribe()
        document.removeEventListener('visibilitychange', recheck)
      }
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  // Abgleich nach dem Anmelden und beim Start, sobald die Aufgaben geladen sind
  useEffect(() => {
    if (!userId || !ready) return
    const timer = window.setTimeout(() => void sync(), 0)
    return () => window.clearTimeout(timer)
  }, [userId, ready, sync])

  // Abgleich bei Rückkehr in die App, wenn das Internet zurückkommt, und regelmäßig
  useEffect(() => {
    if (!userId) return
    const whenVisible = () => {
      if (document.visibilityState === 'visible') void sync()
    }
    document.addEventListener('visibilitychange', whenVisible)
    window.addEventListener('online', whenVisible)
    const timer = window.setInterval(whenVisible, POLL_INTERVAL)
    return () => {
      document.removeEventListener('visibilitychange', whenVisible)
      window.removeEventListener('online', whenVisible)
      window.clearInterval(timer)
    }
  }, [userId, sync])

  // Kurz nach jeder Änderung auf diesem Gerät sichern
  useEffect(() => {
    if (!userId || !ready || tasks === syncedTasks.current) return
    const timer = window.setTimeout(() => void sync(), CHANGE_DELAY)
    return () => window.clearTimeout(timer)
  }, [tasks, userId, ready, sync])

  const sendCode = useCallback(async (email: string) => {
    const client = getSupabase()
    if (!client) return
    const supabase = await client
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL },
    })
    if (error) throw error
  }, [])

  const verifyCode = useCallback(async (email: string, code: string) => {
    const client = getSupabase()
    if (!client) return
    const supabase = await client
    // Eingefügter Link aus der E-Mail: der Schlüssel steht darin als "token"
    const link = readEmailLink(code)
    const { data, error } = link
      ? await supabase.auth.verifyOtp({ token_hash: link.tokenHash, type: link.type })
      : await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
    if (error) throw error
    setSession(data.session)
  }, [])

  const signOut = useCallback(async () => {
    const client = getSupabase()
    if (!client) return
    const supabase = await client
    // Nur auf diesem Gerät abmelden; die Aufgaben bleiben hier und in der Cloud erhalten
    await supabase.auth.signOut({ scope: 'local' })
    setSession(null)
  }, [])

  return {
    available: isCloudConfigured,
    email: session?.user.email ?? null,
    syncState,
    lastSyncedAt,
    sendCode,
    verifyCode,
    signOut,
    syncNow: () => void sync(),
  }
}

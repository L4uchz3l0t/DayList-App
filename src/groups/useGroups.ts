import { useCallback, useEffect, useRef, useState } from 'react'
import { isMissingSetup, loadGroups } from './groupStore'
import type { Group } from './types'

/*
  Hält die Gruppen aktuell: beim Start, bei jeder Rückkehr in die App und alle paar Minuten.
  Der letzte Stand liegt zusätzlich im Browser, damit Gruppen auch ohne Internet sichtbar bleiben.
*/

const CACHE_KEY = 'groupsCache'
const POLL_INTERVAL = 5 * 60 * 1000

export type GroupsStatus = 'signed-out' | 'loading' | 'ready' | 'offline' | 'not-set-up' | 'error'

function readCache(email: string | null): Group[] {
  if (!email) return []
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as { email: string; groups: Group[] } | null
    return cached?.email === email ? cached.groups : []
  } catch {
    return []
  }
}

export interface GroupsData {
  status: GroupsStatus
  groups: Group[]
  /** Eigene E-Mail-Adresse (kleingeschrieben), null wenn nicht angemeldet */
  email: string | null
  reload: () => Promise<void>
  /** Führt eine Änderung aus und lädt danach neu. Fehler werden an den Aufrufer weitergegeben. */
  run: (action: () => Promise<unknown>) => Promise<void>
}

export function useGroups(accountEmail: string | null): GroupsData {
  const email = accountEmail?.toLowerCase() ?? null
  const [groups, setGroups] = useState<Group[]>(() => readCache(email))
  const [status, setStatus] = useState<GroupsStatus>(email ? 'loading' : 'signed-out')
  const loadedFor = useRef(email)

  // Anderes Konto: alten Stand verwerfen
  if (loadedFor.current !== email) {
    loadedFor.current = email
    setGroups(readCache(email))
    setStatus(email ? 'loading' : 'signed-out')
  }

  const reload = useCallback(async () => {
    if (!email) return
    if (!navigator.onLine) {
      setStatus('offline')
      return
    }
    try {
      const loaded = await loadGroups()
      setGroups(loaded)
      setStatus('ready')
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ email, groups: loaded }))
      } catch {
        // Ohne Zwischenspeicher fehlen die Gruppen nur ohne Internet
      }
    } catch (error) {
      console.error('Gruppen laden fehlgeschlagen', error)
      setStatus(isMissingSetup(error) ? 'not-set-up' : navigator.onLine ? 'error' : 'offline')
    }
  }, [email])

  useEffect(() => {
    if (!email) return
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
  }, [email, reload])

  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      try {
        await action()
      } finally {
        await reload()
      }
    },
    [reload],
  )

  return { status, groups: email ? groups : [], email, reload, run }
}

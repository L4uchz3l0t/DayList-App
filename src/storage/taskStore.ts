import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Task } from '../tasks/types'

/*
  Dauerhafte Speicherung der Aufgaben in IndexedDB, der Datenbank im Browser.
  Die Daten bleiben auf diesem Gerät in diesem Browser, auch nach Neustart.
  Nur diese Datei weiß, wie gespeichert wird. Für eine spätere Cloud-Synchronisation
  wird hier ergänzt, der Rest der App bleibt unverändert.
*/

const DB_NAME = 'aufgaben-app'
const DB_VERSION = 1

interface TaskDB extends DBSchema {
  tasks: {
    key: string
    value: Task
  }
}

let dbPromise: Promise<IDBPDatabase<TaskDB>> | null = null

function getDB(): Promise<IDBPDatabase<TaskDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TaskDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Version 1: ein Speicherbereich "tasks", jede Aufgabe eindeutig über ihre ID.
        // Spätere Änderungen am Aufbau kommen als neue Version hier dazu.
        db.createObjectStore('tasks', { keyPath: 'id' })
      },
    })
    // Schlägt das Öffnen fehl, beim nächsten Versuch neu probieren
    dbPromise.catch(() => {
      dbPromise = null
    })
  }
  return dbPromise
}

/** Lädt alle gespeicherten Aufgaben, sortiert nach Erstellungszeitpunkt. */
export async function loadTasks(): Promise<Task[]> {
  const db = await getDB()
  const tasks = await db.getAll('tasks')
  return tasks.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

/** Speichert eine Aufgabe. Gibt es die ID schon, wird sie überschrieben (keine Doppelten). */
export async function saveTask(task: Task): Promise<void> {
  const db = await getDB()
  await db.put('tasks', task)
}

/** Löscht eine Aufgabe dauerhaft. */
export async function removeStoredTask(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('tasks', id)
}

/**
 * Bittet den Browser, die Daten nicht automatisch zu löschen, wenn der Speicher knapp wird.
 * Nicht jeder Browser erlaubt das; die App funktioniert in jedem Fall weiter.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) {
      return (await navigator.storage.persisted()) || (await navigator.storage.persist())
    }
  } catch {
    // Nicht unterstützt: kein Problem
  }
  return false
}

/** Nur für Tests: Verbindung schließen, damit die Datenbank neu geöffnet werden kann. */
export async function closeTaskStoreForTests(): Promise<void> {
  if (dbPromise) (await dbPromise).close()
  dbPromise = null
}

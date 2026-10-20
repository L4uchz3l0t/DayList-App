import { useCallback, useEffect, useRef, useState } from 'react'
import { mergeTasks } from '../storage/backup'
import { addPendingDelete, removePendingDeletes } from '../sync/pendingDeletes'
import type { ReconcileResult } from '../sync/reconcile'
import { loadTasks, removeStoredTask, requestPersistentStorage, saveTask } from '../storage/taskStore'
import {
  createTask,
  deleteTask,
  restoreTask,
  toggleTaskStatus,
  updateTask,
  type NewTaskInput,
  type TaskChanges,
} from './taskOperations'
import type { Task } from './types'

const nowIso = () => new Date().toISOString()

export type LoadStatus = 'loading' | 'ready' | 'error'

/**
 * Verwaltet die Aufgabenliste für die Oberfläche.
 * Beim Start werden die gespeicherten Aufgaben aus IndexedDB geladen.
 * Jede Änderung wird sofort angezeigt und im Hintergrund gespeichert.
 * Schlägt das Speichern fehl, meldet sich onSaveError.
 */
export function useTasks(onSaveError: () => void) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [status, setStatus] = useState<LoadStatus>('loading')

  // Aktuelle Liste und Fehler-Rückmeldung für die Aktionen, ohne sie bei jeder Änderung neu zu erzeugen
  const tasksRef = useRef(tasks)
  const onSaveErrorRef = useRef(onSaveError)
  useEffect(() => {
    onSaveErrorRef.current = onSaveError
  })

  const apply = useCallback((next: Task[]) => {
    tasksRef.current = next
    setTasks(next)
  }, [])

  const persist = useCallback((job: Promise<void>) => {
    job.catch((error: unknown) => {
      console.error('Speichern fehlgeschlagen', error)
      onSaveErrorRef.current()
    })
  }, [])

  const load = useCallback(() => {
    loadTasks()
      .then((loaded) => {
        apply(loaded)
        setStatus('ready')
      })
      .catch((error: unknown) => {
        console.error('Laden fehlgeschlagen', error)
        setStatus('error')
      })
  }, [apply])

  useEffect(() => {
    load()
    void requestPersistentStorage()
  }, [load])

  /** Erneuter Ladeversuch nach einem Fehler. */
  const reload = useCallback(() => {
    setStatus('loading')
    load()
  }, [load])

  const addTask = useCallback(
    (input: NewTaskInput) => {
      const task = createTask(input, nowIso())
      apply([...tasksRef.current, task])
      persist(saveTask(task))
    },
    [apply, persist],
  )

  /** Wendet eine Änderung an und speichert die betroffene Aufgabe. */
  const change = useCallback(
    (id: string, operation: (current: Task[]) => Task[]) => {
      const next = operation(tasksRef.current)
      apply(next)
      const changed = next.find((task) => task.id === id)
      if (changed) persist(saveTask(changed))
    },
    [apply, persist],
  )

  const editTask = useCallback(
    (id: string, changes: TaskChanges) => change(id, (current) => updateTask(current, id, changes, nowIso())),
    [change],
  )

  const toggleTask = useCallback(
    (id: string) => change(id, (current) => toggleTaskStatus(current, id, nowIso())),
    [change],
  )

  const removeTask = useCallback(
    (id: string) => {
      apply(deleteTask(tasksRef.current, id))
      persist(removeStoredTask(id))
      // Die Cloud-Sicherung soll die Löschung auch erfahren
      addPendingDelete(id, nowIso())
    },
    [apply, persist],
  )

  const undoRemove = useCallback(
    (task: Task) => {
      // Neuer Zeitstempel: die wiederhergestellte Fassung ist neuer als die Löschung
      const restored = { ...task, updatedAt: nowIso() }
      removePendingDeletes([task.id])
      apply(restoreTask(tasksRef.current, restored))
      persist(saveTask(restored))
    },
    [apply, persist],
  )

  /** Liest Aufgaben aus einer Sicherung ein: fehlende kommen dazu, neuere Fassungen ersetzen ältere. */
  const importTasks = useCallback(
    (incoming: Task[]) => {
      const result = mergeTasks(tasksRef.current, incoming)
      apply(result.tasks)
      for (const task of result.changed) persist(saveTask(task))
      return result
    },
    [apply, persist],
  )

  /** Aktuelle Liste, auch außerhalb des Zeichnens (für den Cloud-Abgleich) */
  const getTasks = useCallback(() => tasksRef.current, [])

  /** Übernimmt das Ergebnis eines Cloud-Abgleichs und speichert es auf dem Gerät. */
  const applySync = useCallback(
    (result: ReconcileResult) => {
      if (result.saveLocally.length === 0 && result.removeLocally.length === 0) return
      apply(result.tasks)
      for (const task of result.saveLocally) persist(saveTask(task))
      for (const id of result.removeLocally) persist(removeStoredTask(id))
    },
    [apply, persist],
  )

  return {
    tasks,
    status,
    reload,
    addTask,
    editTask,
    toggleTask,
    removeTask,
    undoRemove,
    importTasks,
    getTasks,
    applySync,
  }
}

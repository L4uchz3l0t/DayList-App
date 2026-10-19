import { useCallback, useState } from 'react'
import { createSampleTasks } from './sampleTasks'
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

/**
 * Verwaltet die Aufgabenliste für die Oberfläche.
 * Phase 3: Die Liste lebt nur im Arbeitsspeicher (nach dem Neuladen wieder Beispieldaten).
 * Phase 4: Hier wird die Speicherung in IndexedDB angeschlossen, die Oberfläche bleibt gleich.
 */
export function useTasks(today: Date) {
  const [tasks, setTasks] = useState<Task[]>(() => createSampleTasks(today))

  const addTask = useCallback((input: NewTaskInput) => {
    setTasks((current) => [...current, createTask(input, nowIso())])
  }, [])

  const editTask = useCallback((id: string, changes: TaskChanges) => {
    setTasks((current) => updateTask(current, id, changes, nowIso()))
  }, [])

  const toggleTask = useCallback((id: string) => {
    setTasks((current) => toggleTaskStatus(current, id, nowIso()))
  }, [])

  const removeTask = useCallback((id: string) => {
    setTasks((current) => deleteTask(current, id))
  }, [])

  const undoRemove = useCallback((task: Task) => {
    setTasks((current) => restoreTask(current, task))
  }, [])

  return { tasks, addTask, editTask, toggleTask, removeTask, undoRemove }
}

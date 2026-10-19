import { describe, expect, it } from 'vitest'
import {
  createTask,
  deleteTask,
  moveTaskToInbox,
  restoreTask,
  scheduleTask,
  toggleTaskStatus,
  updateTask,
} from './taskOperations'
import type { Task } from './types'

const CREATED = '2026-10-19T08:00:00.000Z'
const LATER = '2026-10-19T09:30:00.000Z'

function sampleTask(fields: Partial<Task> = {}): Task {
  return { id: 'a', title: 'Milch kaufen', status: 'open', createdAt: CREATED, updatedAt: CREATED, ...fields }
}

describe('createTask', () => {
  it('legt eine offene Aufgabe ohne Datum im Eingang an', () => {
    const task = createTask('  Milch kaufen  ', undefined, CREATED)
    expect(task.title).toBe('Milch kaufen')
    expect(task.status).toBe('open')
    expect(task.plannedDate).toBeUndefined()
    expect(task.createdAt).toBe(CREATED)
    expect(task.updatedAt).toBe(CREATED)
    expect(task.id).not.toBe('')
  })

  it('übernimmt den geplanten Tag', () => {
    expect(createTask('Arzt', '2026-10-20', CREATED).plannedDate).toBe('2026-10-20')
  })

  it('vergibt bei jeder Aufgabe eine neue ID', () => {
    expect(createTask('A', undefined, CREATED).id).not.toBe(createTask('B', undefined, CREATED).id)
  })
})

describe('updateTask', () => {
  it('ändert den Titel und den Änderungszeitpunkt, aber nicht den Erstellungszeitpunkt', () => {
    const [task] = updateTask([sampleTask()], 'a', { title: 'Hafermilch kaufen' }, LATER)
    expect(task.title).toBe('Hafermilch kaufen')
    expect(task.updatedAt).toBe(LATER)
    expect(task.createdAt).toBe(CREATED)
  })

  it('ignoriert einen leeren Titel', () => {
    const [task] = updateTask([sampleTask()], 'a', { title: '   ' }, LATER)
    expect(task.title).toBe('Milch kaufen')
  })

  it('entfernt Frist und Priorität, wenn sie auf leer gesetzt werden', () => {
    const start = sampleTask({ dueDate: '2026-10-25', priority: 'high' })
    const [task] = updateTask([start], 'a', { dueDate: undefined, priority: undefined }, LATER)
    expect('dueDate' in task).toBe(false)
    expect('priority' in task).toBe(false)
  })

  it('lässt nicht genannte Felder unverändert', () => {
    const start = sampleTask({ plannedDate: '2026-10-19', dueDate: '2026-10-25' })
    const [task] = updateTask([start], 'a', { title: 'Neu' }, LATER)
    expect(task.plannedDate).toBe('2026-10-19')
    expect(task.dueDate).toBe('2026-10-25')
  })

  it('verändert andere Aufgaben nicht', () => {
    const other = sampleTask({ id: 'b', title: 'Anderes' })
    const result = updateTask([sampleTask(), other], 'a', { title: 'Neu' }, LATER)
    expect(result[1]).toBe(other)
  })

  it('verändert die ursprüngliche Liste nicht', () => {
    const original = [sampleTask()]
    updateTask(original, 'a', { title: 'Neu' }, LATER)
    expect(original[0].title).toBe('Milch kaufen')
  })
})

describe('toggleTaskStatus', () => {
  it('erledigt eine offene Aufgabe und öffnet sie wieder', () => {
    const done = toggleTaskStatus([sampleTask()], 'a', LATER)
    expect(done[0].status).toBe('done')
    expect(toggleTaskStatus(done, 'a', LATER)[0].status).toBe('open')
  })

  it('behält beim Erledigen den geplanten Tag', () => {
    const [task] = toggleTaskStatus([sampleTask({ plannedDate: '2026-10-17' })], 'a', LATER)
    expect(task.plannedDate).toBe('2026-10-17')
  })

  it('ändert nichts bei unbekannter ID', () => {
    const tasks = [sampleTask()]
    expect(toggleTaskStatus(tasks, 'gibt-es-nicht', LATER)).toBe(tasks)
  })
})

describe('Einplanen und Eingang', () => {
  it('plant eine Aufgabe für einen Tag ein', () => {
    expect(scheduleTask([sampleTask()], 'a', '2026-10-22', LATER)[0].plannedDate).toBe('2026-10-22')
  })

  it('verschiebt eine Aufgabe in den Eingang, ohne die Frist zu verlieren', () => {
    const start = sampleTask({ plannedDate: '2026-10-17', dueDate: '2026-10-25' })
    const [task] = moveTaskToInbox([start], 'a', LATER)
    expect(task.plannedDate).toBeUndefined()
    expect(task.dueDate).toBe('2026-10-25')
  })
})

describe('Löschen und Wiederherstellen', () => {
  it('löscht nur die gewählte Aufgabe', () => {
    const result = deleteTask([sampleTask(), sampleTask({ id: 'b' })], 'a')
    expect(result.map((t) => t.id)).toEqual(['b'])
  })

  it('stellt eine gelöschte Aufgabe wieder her', () => {
    const task = sampleTask()
    expect(restoreTask(deleteTask([task], 'a'), task)).toEqual([task])
  })

  it('erzeugt beim Wiederherstellen keine doppelten Einträge', () => {
    const task = sampleTask()
    expect(restoreTask([task], task)).toHaveLength(1)
  })
})

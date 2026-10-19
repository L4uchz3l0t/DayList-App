import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import type { Task } from '../tasks/types'
import { closeTaskStoreForTests, loadTasks, removeStoredTask, saveTask } from './taskStore'

// fake-indexeddb ersetzt im Test die Browser-Datenbank durch eine im Arbeitsspeicher

function task(id: string, fields: Partial<Task> = {}): Task {
  return {
    id,
    title: `Aufgabe ${id}`,
    status: 'open',
    createdAt: `2026-10-19T08:00:0${id}.000Z`,
    updatedAt: `2026-10-19T08:00:0${id}.000Z`,
    ...fields,
  }
}

afterEach(async () => {
  for (const t of await loadTasks()) await removeStoredTask(t.id)
})

describe('taskStore', () => {
  it('ist am Anfang leer', async () => {
    expect(await loadTasks()).toEqual([])
  })

  it('speichert Aufgaben und lädt sie wieder', async () => {
    await saveTask(task('1', { plannedDate: '2026-10-20', dueDate: '2026-10-22', priority: 'high' }))
    const [loaded] = await loadTasks()
    expect(loaded).toEqual(task('1', { plannedDate: '2026-10-20', dueDate: '2026-10-22', priority: 'high' }))
  })

  it('behält die Daten, wenn die Datenbank neu geöffnet wird (wie nach einem Neustart)', async () => {
    await saveTask(task('1'))
    await closeTaskStoreForTests()
    expect(await loadTasks()).toHaveLength(1)
  })

  it('überschreibt beim erneuten Speichern statt doppelt anzulegen', async () => {
    await saveTask(task('1'))
    await saveTask(task('1', { title: 'Geändert', status: 'done' }))
    const tasks = await loadTasks()
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe('Geändert')
    expect(tasks[0].status).toBe('done')
  })

  it('löscht nur die gewählte Aufgabe', async () => {
    await saveTask(task('1'))
    await saveTask(task('2'))
    await removeStoredTask('1')
    expect((await loadTasks()).map((t) => t.id)).toEqual(['2'])
  })

  it('liefert die Aufgaben in der Reihenfolge ihrer Erstellung', async () => {
    await saveTask(task('3'))
    await saveTask(task('1'))
    await saveTask(task('2'))
    expect((await loadTasks()).map((t) => t.id)).toEqual(['1', '2', '3'])
  })

  it('übernimmt entfernte Felder (zum Beispiel gelöschte Frist)', async () => {
    await saveTask(task('1', { dueDate: '2026-10-22' }))
    await saveTask(task('1'))
    const [loaded] = await loadTasks()
    expect('dueDate' in loaded).toBe(false)
  })
})

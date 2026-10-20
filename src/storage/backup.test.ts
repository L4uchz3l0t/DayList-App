import { describe, expect, it } from 'vitest'
import type { Task } from '../tasks/types'
import { backupFileName, createBackup, InvalidBackupError, mergeTasks, parseBackup } from './backup'

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

describe('createBackup und parseBackup', () => {
  it('liest eine Sicherung unverändert wieder ein', () => {
    const tasks = [
      task('1', { plannedDate: '2026-10-20', dueDate: '2026-10-22', priority: 'high' }),
      task('2', { status: 'done' }),
    ]
    expect(parseBackup(createBackup(tasks, '2026-10-20T09:00:00.000Z'))).toEqual(tasks)
  })

  it('liest auch eine leere Sicherung', () => {
    expect(parseBackup(createBackup([], '2026-10-20T09:00:00.000Z'))).toEqual([])
  })

  it('übernimmt nur bekannte Felder', () => {
    const text = JSON.stringify({ app: 'DayList', version: 1, tasks: [{ ...task('1'), fremd: 'x' }] })
    expect(parseBackup(text)).toEqual([task('1')])
  })

  it.each([
    ['kein JSON', 'hallo'],
    ['andere Datei', JSON.stringify({ name: 'irgendwas' })],
    ['falsche App', JSON.stringify({ app: 'Andere', version: 1, tasks: [] })],
    ['neuere Version', JSON.stringify({ app: 'DayList', version: 99, tasks: [] })],
    ['Aufgabe ohne Titel', JSON.stringify({ app: 'DayList', version: 1, tasks: [{ ...task('1'), title: '' }] })],
    ['falscher Status', JSON.stringify({ app: 'DayList', version: 1, tasks: [{ ...task('1'), status: 'weg' }] })],
    ['falsches Datum', JSON.stringify({ app: 'DayList', version: 1, tasks: [task('1', { plannedDate: '20.10.2026' })] })],
  ])('lehnt ab: %s', (_name, text) => {
    expect(() => parseBackup(text)).toThrow(InvalidBackupError)
  })

  it('baut den Dateinamen mit Datum', () => {
    expect(backupFileName('2026-10-20')).toBe('daylist-sicherung-2026-10-20.json')
  })
})

describe('mergeTasks', () => {
  it('fügt neue Aufgaben hinzu und lässt vorhandene stehen', () => {
    const result = mergeTasks([task('1')], [task('2')])
    expect(result.tasks.map((t) => t.id)).toEqual(['1', '2'])
    expect(result.added).toBe(1)
    expect(result.updated).toBe(0)
    expect(result.changed.map((t) => t.id)).toEqual(['2'])
  })

  it('erzeugt keine Doppelten, wenn dieselbe Sicherung zweimal geladen wird', () => {
    const backup = [task('1'), task('2')]
    const first = mergeTasks([], backup)
    const second = mergeTasks(first.tasks, backup)
    expect(second.tasks).toHaveLength(2)
    expect(second.added + second.updated).toBe(0)
    expect(second.changed).toEqual([])
  })

  it('nimmt bei gleicher ID die zuletzt geänderte Fassung', () => {
    const local = task('1', { title: 'Neu am Handy', updatedAt: '2026-10-20T10:00:00.000Z' })
    const older = task('1', { title: 'Alt aus Sicherung', updatedAt: '2026-10-19T10:00:00.000Z' })
    const newer = task('1', { title: 'Neuer aus Sicherung', updatedAt: '2026-10-21T10:00:00.000Z' })
    expect(mergeTasks([local], [older]).tasks[0].title).toBe('Neu am Handy')
    const result = mergeTasks([local], [newer])
    expect(result.tasks[0].title).toBe('Neuer aus Sicherung')
    expect(result.updated).toBe(1)
  })
})

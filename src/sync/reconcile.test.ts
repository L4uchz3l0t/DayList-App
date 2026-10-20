import { describe, expect, it } from 'vitest'
import type { Task } from '../tasks/types'
import { reconcile, type RemoteRow } from './reconcile'

const T1 = '2026-10-20T08:00:00.000Z'
const T2 = '2026-10-20T09:00:00.000Z'
const T3 = '2026-10-20T10:00:00.000Z'

function task(id: string, updatedAt = T1, fields: Partial<Task> = {}): Task {
  return { id, title: `Aufgabe ${id}`, status: 'open', createdAt: T1, updatedAt, ...fields }
}

const row = (t: Task): RemoteRow => ({ id: t.id, data: t, deleted: false, updated_at: t.updatedAt })
const tombstone = (id: string, at: string): RemoteRow => ({ id, data: null, deleted: true, updated_at: at })

describe('reconcile', () => {
  it('lädt beim ersten Abgleich alle Aufgaben dieses Geräts hoch', () => {
    const result = reconcile([task('a'), task('b')], [], {})
    expect(result.push.map((r) => r.id)).toEqual(['a', 'b'])
    expect(result.saveLocally).toEqual([])
    expect(result.tasks).toHaveLength(2)
  })

  it('holt Aufgaben vom anderen Gerät', () => {
    const result = reconcile([], [row(task('a'))], {})
    expect(result.tasks.map((t) => t.id)).toEqual(['a'])
    expect(result.saveLocally.map((t) => t.id)).toEqual(['a'])
    expect(result.push).toEqual([])
  })

  it('führt beide Geräte zusammen, ohne etwas zu verlieren', () => {
    const result = reconcile([task('handy')], [row(task('pc'))], {})
    expect(result.tasks.map((t) => t.id).sort()).toEqual(['handy', 'pc'])
  })

  it('tut nichts, wenn beide Seiten gleich sind', () => {
    const result = reconcile([task('a')], [row(task('a'))], {})
    expect(result.push).toEqual([])
    expect(result.saveLocally).toEqual([])
    expect(result.removeLocally).toEqual([])
  })

  it('erkennt gleiche Zeitpunkte auch in anderer Schreibweise der Cloud', () => {
    const result = reconcile([task('a')], [{ ...row(task('a')), updated_at: '2026-10-20T08:00:00+00:00' }], {})
    expect(result.push).toEqual([])
  })

  it('nimmt bei gleicher Aufgabe die neuere Fassung', () => {
    const neuHier = reconcile([task('a', T2, { title: 'neu hier' })], [row(task('a', T1))], {})
    expect(neuHier.push[0].data?.title).toBe('neu hier')
    const neuDort = reconcile([task('a', T1)], [row(task('a', T2, { title: 'neu dort' }))], {})
    expect(neuDort.tasks[0].title).toBe('neu dort')
    expect(neuDort.saveLocally[0].title).toBe('neu dort')
  })

  it('löscht hier, was auf dem anderen Gerät gelöscht wurde', () => {
    const result = reconcile([task('a', T1)], [tombstone('a', T2)], {})
    expect(result.tasks).toEqual([])
    expect(result.removeLocally).toEqual(['a'])
  })

  it('behält eine Aufgabe, die hier nach der Löschung anderswo noch geändert wurde', () => {
    const result = reconcile([task('a', T3)], [tombstone('a', T2)], {})
    expect(result.tasks).toHaveLength(1)
    expect(result.push[0]).toMatchObject({ id: 'a', deleted: false })
  })

  it('meldet hier gelöschte Aufgaben an die Cloud', () => {
    const result = reconcile([], [row(task('a', T1))], { a: T2 })
    expect(result.push).toEqual([tombstone('a', T2)])
    expect(result.tasks).toEqual([])
    expect(result.saveLocally).toEqual([])
  })

  it('holt eine hier gelöschte Aufgabe zurück, wenn sie danach anderswo geändert wurde', () => {
    const result = reconcile([], [row(task('a', T3, { title: 'später geändert' }))], { a: T2 })
    expect(result.push).toEqual([])
    expect(result.tasks[0].title).toBe('später geändert')
  })

  it('holt in der Cloud gelöschte Aufgaben nicht zurück', () => {
    const result = reconcile([], [tombstone('a', T2)], {})
    expect(result.tasks).toEqual([])
    expect(result.saveLocally).toEqual([])
  })
})

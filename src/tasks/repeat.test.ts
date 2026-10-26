import { describe, expect, it } from 'vitest'
import { nextRepeatDate, rollRepeatingEvents } from './repeat'
import { toggleTaskStatus } from './taskOperations'
import type { Task } from './types'

const NOW = '2026-10-26T10:00:00.000Z'
const task = (fields: Partial<Task>): Task => ({
  id: 'a',
  title: 'Müll rausbringen',
  status: 'open',
  createdAt: '2026-10-01T08:00:00.000Z',
  updatedAt: '2026-10-01T08:00:00.000Z',
  ...fields,
})

describe('nextRepeatDate', () => {
  it('rechnet Tage, Werktage, Wochen, Monate und Jahre', () => {
    expect(nextRepeatDate('2026-10-26', 'daily')).toBe('2026-10-27')
    expect(nextRepeatDate('2026-10-30', 'weekdays')).toBe('2026-11-02')
    expect(nextRepeatDate('2026-10-26', 'weekly')).toBe('2026-11-02')
    expect(nextRepeatDate('2026-10-26', 'biweekly')).toBe('2026-11-09')
    expect(nextRepeatDate('2026-01-31', 'monthly')).toBe('2026-02-28')
    expect(nextRepeatDate('2026-10-26', 'yearly')).toBe('2027-10-26')
  })
})

describe('Wiederholende Aufgaben', () => {
  it('legt beim Erledigen den nächsten Eintrag an', () => {
    const tasks = toggleTaskStatus([task({ plannedDate: '2026-10-26', repeat: 'weekly', time: '18:00', reminder: 0 })], 'a', NOW)
    expect(tasks).toHaveLength(2)
    const [done, next] = tasks
    expect(done).toMatchObject({ status: 'done', nextId: 'a~2026-11-02' })
    expect(done.repeat).toBeUndefined()
    expect(next).toMatchObject({ id: 'a~2026-11-02', status: 'open', plannedDate: '2026-11-02', repeat: 'weekly', time: '18:00', seriesId: 'a' })
    expect(next.remindAt).toBeDefined()
  })

  it('springt bei verspätet erledigten Aufgaben hinter heute', () => {
    const tasks = toggleTaskStatus([task({ plannedDate: '2026-10-20', repeat: 'daily' })], 'a', NOW)
    expect(tasks[1].plannedDate).toBe('2026-10-27')
  })

  it('nimmt den neuen Eintrag beim Wieder-Öffnen zurück', () => {
    const done = toggleTaskStatus([task({ plannedDate: '2026-10-26', repeat: 'daily' })], 'a', NOW)
    const reopened = toggleTaskStatus(done, 'a', NOW)
    expect(reopened).toHaveLength(1)
    expect(reopened[0]).toMatchObject({ status: 'open', repeat: 'daily' })
  })

  it('legt bei Terminen den nächsten an, sobald der Tag erreicht ist', () => {
    const tasks = [
      task({ id: 'v', kind: 'event', plannedDate: '2026-10-26', time: '09:15', repeat: 'weekly' }),
      task({ id: 'z', kind: 'event', plannedDate: '2026-10-28', repeat: 'weekly' }),
    ]
    const { created, updated } = rollRepeatingEvents(tasks, '2026-10-26', NOW)
    expect(created.map((t) => [t.id, t.plannedDate])).toEqual([['v~2026-11-02', '2026-11-02']])
    expect(updated[0].repeat).toBeUndefined()
    // Ein zweiter Durchlauf legt nichts doppelt an
    const again = rollRepeatingEvents([...updated, tasks[1], ...created], '2026-10-26', NOW)
    expect(again.created).toHaveLength(0)
  })
})

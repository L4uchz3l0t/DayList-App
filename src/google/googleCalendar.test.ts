import { describe, expect, it } from 'vitest'
import { toEventTasks, type GoogleEvent } from './googleCalendar'

const event = (fields: Partial<GoogleEvent>): GoogleEvent => ({
  id: 'cal/1',
  title: 'Zahnarzt',
  start: {},
  end: {},
  calendar: 'Laurin',
  color: '#000',
  link: 'https://calendar.google.com/x',
  ...fields,
})

describe('toEventTasks', () => {
  it('macht aus einem Termin mit Uhrzeit einen Termin am richtigen Tag mit Beginn und Ende', () => {
    const [task] = toEventTasks([
      event({ start: { dateTime: '2026-10-23T14:30:00+02:00' }, end: { dateTime: '2026-10-23T15:15:00+02:00' } }),
    ])
    expect(task).toMatchObject({
      id: 'google:cal/1',
      kind: 'event',
      plannedDate: '2026-10-23',
      time: '14:30',
      google: { endTime: '15:15', calendar: 'Laurin' },
    })
  })

  it('zeigt ganztägige Termine über mehrere Tage an jedem Tag (Ende ist der Tag danach)', () => {
    const tasks = toEventTasks([event({ start: { date: '2026-10-30' }, end: { date: '2026-11-02' } })])
    expect(tasks.map((task) => task.plannedDate)).toEqual(['2026-10-30', '2026-10-31', '2026-11-01'])
    expect(tasks.every((task) => task.time === undefined)).toBe(true)
    expect(new Set(tasks.map((task) => task.id)).size).toBe(3)
  })

  it('lässt das Ende weg, wenn der Termin über Mitternacht geht', () => {
    const [task] = toEventTasks([
      event({ start: { dateTime: '2026-10-23T22:00:00+02:00' }, end: { dateTime: '2026-10-24T02:00:00+02:00' } }),
    ])
    expect(task.google?.endTime).toBeUndefined()
  })
})

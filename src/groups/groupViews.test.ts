import { describe, expect, it } from 'vitest'
import { isGroupTaskId, fromCalendarId, openCountFor, tasksFor, tasksOfOthers, toCalendarTasks } from './groupViews'
import type { Group, GroupMember, GroupTask } from './types'

const TODAY = '2026-10-22'

const member = (email: string, name: string, fields: Partial<GroupMember> = {}): GroupMember => ({
  group_id: 'g',
  email,
  display_name: name,
  user_id: 'u-' + name,
  role: 'member',
  show_in_calendar: true,
  pinned: false,
  ...fields,
})

const task = (id: string, assignee: string, due: string, fields: Partial<GroupTask> = {}): GroupTask => ({
  id,
  group_id: 'g',
  title: id,
  assignee,
  due_date: due,
  time: null,
  reminder: null,
  done_at: null,
  series_id: null,
  occurrence: null,
  skipped: false,
  ...fields,
})

const group: Group = {
  id: 'g',
  name: 'WG Putzplan',
  timezone: 'Europe/Berlin',
  members: [member('laurin@x.de', 'Laurin', { role: 'admin' }), member('max@x.de', 'Max'), member('lea@x.de', 'Lea')],
  series: [],
  tasks: [
    task('Bad', 'laurin@x.de', '2026-10-23', { time: '18:00', reminder: 30 }),
    task('Müll', 'laurin@x.de', '2026-10-21'),
    task('Alt erledigt', 'laurin@x.de', '2026-10-01', { done_at: '2026-10-01T10:00:00Z' }),
    task('Staub', 'lea@x.de', '2026-10-22', { done_at: '2026-10-22T09:00:00Z' }),
    task('Fenster', 'lea@x.de', '2026-10-24'),
    task('Ausgelassen', 'max@x.de', '2026-10-25', { skipped: true }),
    task('Keller', 'jonas@x.de', '2026-10-24'),
  ],
}

describe('Gruppen-Ansichten', () => {
  it('zeigt unter "Für dich" die eigenen offenen Aufgaben nach Frist, ohne alte erledigte', () => {
    expect(tasksFor(group, 'Laurin@x.de', TODAY).map((t) => t.id)).toEqual(['Müll', 'Bad'])
  })

  it('zählt offene Aufgaben pro Person ohne ausgelassene', () => {
    expect(openCountFor(group, 'laurin@x.de')).toBe(2)
    expect(openCountFor(group, 'max@x.de')).toBe(0)
  })

  it('zeigt die anderen nach Mitgliederliste, Ehemalige am Ende', () => {
    const others = tasksOfOthers(group, 'laurin@x.de', TODAY)
    expect(others.map((p) => p.name)).toEqual(['Max', 'Lea', 'jonas@x.de'])
    expect(others[1].tasks.map((t) => t.id)).toEqual(['Fenster', 'Staub'])
    expect(others[0].tasks).toEqual([])
  })

  it('bringt eigene Gruppenaufgaben in den Kalender, wenn eingeschaltet', () => {
    const tasks = toCalendarTasks([group], 'laurin@x.de')
    expect(tasks.map((t) => t.id)).toEqual(['g:Bad', 'g:Müll', 'g:Alt erledigt'])
    expect(tasks[0]).toMatchObject({ plannedDate: '2026-10-23', time: '18:00', reminder: 30, group: { name: 'WG Putzplan' } })
    expect(tasks[2].status).toBe('done')
    expect(isGroupTaskId(tasks[0].id) && fromCalendarId(tasks[0].id)).toBe('Bad')
    const off = { ...group, members: group.members.map((m) => ({ ...m, show_in_calendar: false })) }
    expect(toCalendarTasks([off], 'laurin@x.de')).toEqual([])
  })
})

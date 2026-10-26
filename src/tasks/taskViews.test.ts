import { describe, expect, it } from 'vitest'
import {
  byTimeAndPriority,
  countTasksByDay,
  describePlannedDay,
  getInboxTasks,
  getOverdueTasks,
  getDay,
  getEventDays,
  getUpcomingTasks,
  getWeekDays,
  heatLevel,
  isEventOver,
  searchTasks,
} from './taskViews'
import type { Task } from './types'

const TODAY = '2026-10-19'

function task(id: string, fields: Partial<Task> = {}): Task {
  return {
    id,
    title: id,
    status: 'open',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    ...fields,
  }
}

describe('getOverdueTasks', () => {
  it('zeigt nur offene Aufgaben mit Tag vor heute, wichtige und älteste zuerst', () => {
    const tasks = [
      task('gestern', { plannedDate: '2026-10-18' }),
      task('heute', { plannedDate: TODAY }),
      task('erledigt', { plannedDate: '2026-10-10', status: 'done' }),
      task('alt', { plannedDate: '2026-10-05' }),
      task('wichtig', { plannedDate: '2026-10-17', priority: 'high' }),
      task('eingang'),
    ]
    expect(getOverdueTasks(tasks, TODAY).map((t) => t.id)).toEqual(['wichtig', 'alt', 'gestern'])
  })

  it('erkennt Überfälliges über Monats- und Jahresgrenzen', () => {
    const tasks = [task('silvester', { plannedDate: '2026-12-31' })]
    expect(getOverdueTasks(tasks, '2027-01-01')).toHaveLength(1)
    expect(getOverdueTasks(tasks, '2026-12-31')).toHaveLength(0)
  })
})

describe('getInboxTasks', () => {
  it('trennt offene und erledigte Aufgaben ohne Tag', () => {
    const tasks = [task('a'), task('b', { status: 'done' }), task('c', { plannedDate: TODAY })]
    const inbox = getInboxTasks(tasks)
    expect(inbox.open.map((t) => t.id)).toEqual(['a'])
    expect(inbox.done.map((t) => t.id)).toEqual(['b'])
  })
})

describe('getWeekDays', () => {
  it('liefert 7 Tage ab heute', () => {
    const days = getWeekDays([], TODAY)
    expect(days.map((d) => d.dateKey)).toEqual([
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
    ])
  })

  it('läuft über die Zeitumstellung und den Monatswechsel ohne Lücke', () => {
    const days = getWeekDays([], '2026-10-28')
    expect(days.map((d) => d.dateKey)).toEqual([
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
    ])
  })

  it('ordnet Aufgaben ihrem Tag zu: offene (wichtige zuerst), dann erledigte', () => {
    const tasks = [
      task('erledigt', { plannedDate: '2026-10-20', status: 'done' }),
      task('normal', { plannedDate: '2026-10-20' }),
      task('wichtig', { plannedDate: '2026-10-20', priority: 'high' }),
      task('später', { plannedDate: '2026-10-30' }),
    ]
    const tomorrow = getWeekDays(tasks, TODAY)[1]
    expect(tomorrow.tasks.map((t) => t.id)).toEqual(['wichtig', 'normal', 'erledigt'])
    expect(getWeekDays(tasks, TODAY).flatMap((d) => d.tasks)).toHaveLength(3)
  })

  it('zeigt Fristen am Fristtag, getrennt vom geplanten Tag', () => {
    const tasks = [
      task('steuer', { plannedDate: '2026-10-20', dueDate: '2026-10-23' }),
      task('fertig', { dueDate: '2026-10-23', status: 'done' }),
    ]
    const days = getWeekDays(tasks, TODAY)
    expect(days[1].tasks.map((t) => t.id)).toEqual(['steuer'])
    expect(days[4].deadlines.map((t) => t.id)).toEqual(['steuer'])
    expect(days[1].deadlines).toEqual([])
  })
})

describe('searchTasks', () => {
  const tasks = [task('a', { title: 'Milch kaufen' }), task('b', { title: 'Steuer ÄNDERN' })]

  it('findet Teile des Titels unabhängig von Groß- und Kleinschreibung', () => {
    expect(searchTasks(tasks, 'milch').map((t) => t.id)).toEqual(['a'])
    expect(searchTasks(tasks, ' änder ').map((t) => t.id)).toEqual(['b'])
  })

  it('gibt bei leerer Suche alles zurück', () => {
    expect(searchTasks(tasks, '  ')).toHaveLength(2)
  })
})

describe('getUpcomingTasks', () => {
  it('sortiert offene geplante Aufgaben ab heute nach Datum', () => {
    const tasks = [
      task('übermorgen', { plannedDate: '2026-10-21' }),
      task('heute', { plannedDate: TODAY }),
      task('gestern', { plannedDate: '2026-10-18' }),
      task('eingang'),
    ]
    expect(getUpcomingTasks(tasks, TODAY).map((t) => t.id)).toEqual(['heute', 'übermorgen'])
  })
})

describe('describePlannedDay', () => {
  it('benennt Irgendwann, Heute, Morgen und andere Tage', () => {
    expect(describePlannedDay(undefined, TODAY)).toBe('Irgendwann')
    expect(describePlannedDay(TODAY, TODAY)).toBe('Heute')
    expect(describePlannedDay('2026-10-20', TODAY)).toBe('Morgen')
    expect(describePlannedDay('2026-10-23', TODAY)).toBe('23. Okt.')
  })

  it('kann andere Sprachen', () => {
    const en = { someday: 'Someday', today: 'Today', tomorrow: 'Tomorrow' }
    expect(describePlannedDay(undefined, TODAY, en, 'en-GB')).toBe('Someday')
    expect(describePlannedDay('2026-10-23', TODAY, en, 'en-GB')).toBe('23 Oct')
  })

  it('erkennt Morgen auch am Monatsende', () => {
    expect(describePlannedDay('2026-11-01', '2026-10-31')).toBe('Morgen')
  })
})

describe('Kalender', () => {
  it('zählt geplante Aufgaben je Tag, offene und erledigte', () => {
    const counts = countTasksByDay([
      task('a', { plannedDate: TODAY }),
      task('b', { plannedDate: TODAY, status: 'done' }),
      task('c', { plannedDate: '2026-10-20' }),
      task('d'),
    ])
    expect(counts.get(TODAY)).toBe(2)
    expect(counts.get('2026-10-20')).toBe(1)
    expect(counts.size).toBe(2)
  })

  it('färbt Tage mit mehr Aufgaben kräftiger', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 12].map(heatLevel)).toEqual([0, 1, 2, 2, 3, 3, 4, 4])
  })
})

describe('byTimeAndPriority', () => {
  it('zeigt Aufgaben mit Uhrzeit zuerst, nach Uhrzeit sortiert', () => {
    const sorted = [
      task('ohne'),
      task('wichtig', { priority: 'high' }),
      task('spät', { time: '18:00' }),
      task('früh', { time: '08:15' }),
    ].sort(byTimeAndPriority)
    expect(sorted.map((t) => t.id)).toEqual(['früh', 'spät', 'wichtig', 'ohne'])
  })
})

describe('Termine', () => {
  const tasks = [
    task('a', { plannedDate: TODAY }),
    task('t2', { plannedDate: TODAY, kind: 'event', time: '15:00' }),
    task('t1', { plannedDate: TODAY, kind: 'event', time: '09:00' }),
    task('ganz', { plannedDate: TODAY, kind: 'event' }),
    task('alt', { plannedDate: '2026-10-10', kind: 'event' }),
  ]

  it('stehen in einem eigenen Bereich, ganztägige zuerst, dann nach Uhrzeit', () => {
    const day = getDay(tasks, TODAY)
    expect(day.tasks.map((t) => t.id)).toEqual(['a'])
    expect(day.events.map((t) => t.id)).toEqual(['ganz', 't1', 't2'])
  })

  it('sind nie überfällig und färben den Kalender nicht', () => {
    expect(getOverdueTasks(tasks, TODAY)).toEqual([])
    expect(countTasksByDay(tasks).get(TODAY)).toBe(1)
    expect([...getEventDays(tasks)].sort()).toEqual(['2026-10-10', TODAY])
  })
})

describe('isEventOver', () => {
  const event = (time?: string, endTime?: string) =>
    ({ id: 'e', title: 'T', kind: 'event', status: 'open', time, plannedDate: '2026-10-26',
      ...(endTime ? { google: { link: '', calendar: '', endTime } } : {}) }) as unknown as Parameters<typeof isEventOver>[0]

  it('zeigt ganztägige Termine den ganzen Tag', () => {
    expect(isEventOver(event(), '23:59')).toBe(false)
  })
  it('nimmt ohne Endzeit eine Stunde an', () => {
    expect(isEventOver(event('10:00'), '10:59')).toBe(false)
    expect(isEventOver(event('10:00'), '11:00')).toBe(true)
  })
  it('nutzt die Endzeit aus Google', () => {
    expect(isEventOver(event('10:00', '12:30'), '12:00')).toBe(false)
    expect(isEventOver(event('10:00', '12:30'), '12:30')).toBe(true)
  })
})

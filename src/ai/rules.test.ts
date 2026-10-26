import { describe, expect, it } from 'vitest'
import { classifyText, planWeekWithRules } from './rules'

// Montag, 26. Oktober 2026
const TODAY = '2026-10-26'

describe('classifyText', () => {
  it('erkennt Termine an Uhrzeit, Tag und Wörtern', () => {
    expect(classifyText('Zahnarzt morgen 14:30', TODAY)).toEqual({
      kind: 'event',
      title: 'Zahnarzt',
      date: '2026-10-27',
      time: '14:30',
    })
    expect(classifyText('Kino mit Mia am Freitag um 20 Uhr', TODAY)).toEqual({
      kind: 'event',
      title: 'Kino mit Mia',
      date: '2026-10-30',
      time: '20:00',
    })
    expect(classifyText('Vorlesung Statistik', TODAY).kind).toBe('event')
    expect(classifyText('Zahnarzt übermorgen 9 Uhr', TODAY)).toMatchObject({ title: 'Zahnarzt', date: '2026-10-28' })
    expect(classifyText('Am nächsten Dienstag Wäsche waschen', TODAY)).toEqual({
      kind: 'task',
      title: 'Wäsche waschen',
      date: '2026-10-27',
    })
  })

  it('lässt Aufgaben ohne Termin-Hinweis als Aufgabe', () => {
    expect(classifyText('Milch kaufen', TODAY)).toEqual({ kind: 'task', title: 'Milch kaufen' })
    expect(classifyText('Team anrufen', TODAY)).toEqual({ kind: 'task', title: 'Team anrufen' })
    // "Training" steckt nicht in "Trainingsplan schreiben"
    expect(classifyText('Trainingsplan schreiben', TODAY).kind).toBe('task')
  })

  it('liest ein Datum nicht als Uhrzeit', () => {
    expect(classifyText('Bewerbung abschicken 12.11.', TODAY)).toEqual({
      kind: 'task',
      title: 'Bewerbung abschicken',
      date: '2026-11-12',
    })
  })

  it('meint am gleichen Wochentag die nächste Woche', () => {
    expect(classifyText('Montag Wäsche', TODAY).date).toBe('2026-11-02')
  })
})

describe('planWeekWithRules', () => {
  const base = { action: 'planWeek' as const, today: TODAY, timeZone: 'Europe/Berlin', openTasks: [] }

  it('verteilt lange Vorhaben auf mehrere Tage und fragt nach', () => {
    const result = planWeekWithRules({ ...base, wishes: '3 Stunden für Statistik lernen', busy: [] })
    expect(result.proposals).toHaveLength(2)
    expect(result.proposals.every((proposal) => proposal.title === 'Statistik lernen')).toBe(true)
    expect(result.proposals.map((proposal) => proposal.durationMinutes)).toEqual([90, 90])
    expect(new Set(result.proposals.map((proposal) => proposal.date)).size).toBe(2)
    expect(result.question).toContain('2 Tage')
  })

  it('legt Lernzeit nicht in belegte Zeiten', () => {
    const busy = ['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'].map(
      (date) => ({ date, from: '09:00', to: '12:00', title: 'Vorlesung' }),
    )
    const [proposal] = planWeekWithRules({ ...base, wishes: '1 Stunde lernen', busy }).proposals
    expect(proposal.time).toBe('12:15')
  })

  it('legt Aufgaben ohne Dauer auf den ruhigsten Tag', () => {
    const busy = [{ date: '2026-10-27', from: '10:00', to: '11:00', title: 'Arzt' }]
    const result = planWeekWithRules({ ...base, wishes: 'Wäsche, Oma anrufen', busy })
    expect(result.proposals.map((proposal) => [proposal.title, proposal.kind, proposal.date])).toEqual([
      ['Wäsche', 'task', '2026-10-28'],
      ['Oma anrufen', 'task', '2026-10-29'],
    ])
  })

  it('übernimmt angegebene Tage und Zeiten', () => {
    const [proposal] = planWeekWithRules({ ...base, wishes: 'Friseur Donnerstag 16 Uhr', busy: [] }).proposals
    expect(proposal).toMatchObject({ title: 'Friseur', kind: 'event', date: '2026-10-29', time: '16:00' })
  })
})

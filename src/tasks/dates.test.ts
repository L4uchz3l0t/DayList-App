import { describe, expect, it } from 'vitest'
import { addDays, getMonthGrid, msUntilNextDay, toDateKey } from './dates'

describe('toDateKey', () => {
  it('nutzt die lokale Zeit und füllt mit Nullen auf', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('bleibt kurz vor Mitternacht beim selben Tag', () => {
    expect(toDateKey(new Date(2026, 9, 19, 23, 59))).toBe('2026-10-19')
  })
})

describe('addDays', () => {
  it('springt über Monats- und Jahresgrenzen', () => {
    expect(toDateKey(addDays(new Date(2026, 9, 31), 1))).toBe('2026-11-01')
    expect(toDateKey(addDays(new Date(2026, 11, 31), 1))).toBe('2027-01-01')
  })

  it('funktioniert rückwärts', () => {
    expect(toDateKey(addDays(new Date(2026, 2, 1), -1))).toBe('2026-02-28')
  })

  it('zählt über die Zeitumstellung hinweg richtig', () => {
    // In Deutschland wird am 25.10.2026 auf Winterzeit umgestellt
    expect(toDateKey(addDays(new Date(2026, 9, 24), 1))).toBe('2026-10-25')
    expect(toDateKey(addDays(new Date(2026, 9, 25), 1))).toBe('2026-10-26')
  })

  it('verändert das ursprüngliche Datum nicht', () => {
    const date = new Date(2026, 9, 19)
    addDays(date, 3)
    expect(toDateKey(date)).toBe('2026-10-19')
  })
})

describe('getMonthGrid', () => {
  it('beginnt die Woche am Montag', () => {
    // Der 1. Oktober 2026 ist ein Donnerstag: Mo, Di, Mi bleiben leer
    const grid = getMonthGrid(2026, 9)
    expect(grid.slice(0, 4)).toEqual([null, null, null, '2026-10-01'])
    expect(grid.filter(Boolean)).toHaveLength(31)
  })

  it('kennt Schaltjahre', () => {
    expect(getMonthGrid(2028, 1).filter(Boolean)).toHaveLength(29)
    expect(getMonthGrid(2026, 1).filter(Boolean)).toHaveLength(28)
  })

  it('hat keine Leerfelder, wenn der Monat an einem Montag beginnt', () => {
    // Der 1. Juni 2026 ist ein Montag
    expect(getMonthGrid(2026, 5)[0]).toBe('2026-06-01')
  })
})

describe('msUntilNextDay', () => {
  it('rechnet bis Mitternacht', () => {
    expect(msUntilNextDay(new Date(2026, 9, 19, 23, 59, 0))).toBe(60_000)
  })

  it('berücksichtigt die Zeitumstellung (25.10.2026 hat 25 Stunden)', () => {
    expect(msUntilNextDay(new Date(2026, 9, 25, 0, 0, 0))).toBe(25 * 60 * 60 * 1000)
  })

  it('landet genau auf dem nächsten Tag', () => {
    const now = new Date(2026, 11, 31, 15, 30)
    expect(toDateKey(new Date(now.getTime() + msUntilNextDay(now)))).toBe('2027-01-01')
  })
})

import { describe, expect, it } from 'vitest'
import { addDays, toDateKey } from './dates'

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

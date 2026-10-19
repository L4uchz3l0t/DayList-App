import { useId } from 'react'
import { addDays, parseDateKey, toDateKey } from '../tasks/dates'
import { DateField } from './DateField'
import { Icon } from './Icon'
import './TaskFields.css'

/*
  Eingabe-Bausteine für Aufgaben. Sie werden in der Schnellaufnahme
  und in der Detailansicht verwendet, damit beide gleich aussehen und funktionieren.
*/

interface DayPickerProps {
  /** Geplanter Tag als "JJJJ-MM-TT", leerer Text = Irgendwann (ohne Tag) */
  value: string
  onChange: (value: string) => void
  todayKey: string
  /** Zusätzliches Datumsfeld für beliebige Tage anzeigen */
  showDateInput?: boolean
}

/** Auswahl des geplanten Tages: Irgendwann, Heute, Morgen und optional ein beliebiges Datum. */
export function DayPicker({ value, onChange, todayKey, showDateInput = false }: DayPickerProps) {
  const labelId = useId()
  const options = [
    { label: 'Irgendwann', value: '' },
    { label: 'Heute', value: todayKey },
    { label: 'Morgen', value: toDateKey(addDays(parseDateKey(todayKey), 1)) },
  ]

  return (
    <div className="task-field">
      <span className="task-field__label" id={labelId}>
        Geplant für
      </span>
      <div className="chips" role="radiogroup" aria-labelledby={labelId}>
        {options.map((option) => (
          <button
            key={option.label}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            className="chip"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {showDateInput && (
        <DateField
          label="Anderer Tag"
          placeholder="Anderer Tag …"
          value={value}
          onChange={onChange}
          todayKey={todayKey}
        />
      )}
    </div>
  )
}

interface DueDateFieldProps {
  value: string
  onChange: (value: string) => void
  todayKey: string
}

/** Verbindliche Frist, unabhängig vom geplanten Tag. Leer = keine Frist. */
export function DueDateField({ value, onChange, todayKey }: DueDateFieldProps) {
  return (
    <div className="task-field">
      <span className="task-field__label">Frist (verbindlich, optional)</span>
      <div className="task-field__row">
        <DateField label="Frist" placeholder="Keine Frist" value={value} onChange={onChange} todayKey={todayKey} />
        {value && (
          <button type="button" className="button button--secondary" onClick={() => onChange('')}>
            Keine Frist
          </button>
        )}
      </div>
    </div>
  )
}

interface ImportantToggleProps {
  value: boolean
  onChange: (value: boolean) => void
}

/** Schalter für hohe Priorität ("Wichtig"). */
export function ImportantToggle({ value, onChange }: ImportantToggleProps) {
  return (
    <button
      type="button"
      className="chip task-field__important"
      aria-pressed={value}
      onClick={() => onChange(!value)}
    >
      <Icon name="flag" size={14} /> Wichtig
    </button>
  )
}

import { useId } from 'react'
import { addDays, parseDateKey, toDateKey } from '../tasks/dates'
import { Icon } from './Icon'
import './TaskFields.css'

/*
  Eingabe-Bausteine für Aufgaben. Sie werden in der Schnellaufnahme
  und in der Detailansicht verwendet, damit beide gleich aussehen und funktionieren.
*/

interface DayPickerProps {
  /** Geplanter Tag als "JJJJ-MM-TT", leerer Text = Eingang */
  value: string
  onChange: (value: string) => void
  todayKey: string
  /** Zusätzliches Datumsfeld für beliebige Tage anzeigen */
  showDateInput?: boolean
}

/** Auswahl des geplanten Tages: Eingang, Heute, Morgen und optional ein beliebiges Datum. */
export function DayPicker({ value, onChange, todayKey, showDateInput = false }: DayPickerProps) {
  const labelId = useId()
  const options = [
    { label: 'Eingang', value: '' },
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
        <input
          className="field task-field__date"
          type="date"
          aria-label="Anderer Tag"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  )
}

interface DueDateFieldProps {
  value: string
  onChange: (value: string) => void
}

/** Verbindliche Frist, unabhängig vom geplanten Tag. Leer = keine Frist. */
export function DueDateField({ value, onChange }: DueDateFieldProps) {
  return (
    <div className="task-field">
      <span className="task-field__label">Frist (verbindlich, optional)</span>
      <div className="task-field__row">
        <input
          className="field task-field__date"
          type="date"
          aria-label="Frist"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
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

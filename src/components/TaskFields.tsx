import { useId } from 'react'
import { addDays, parseDateKey, toDateKey } from '../tasks/dates'
import { DateField } from './DateField'
import { Icon } from './Icon'
import './TaskFields.css'
import { useI18n } from '../i18n/useI18n'

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
  const { t } = useI18n()
  const labelId = useId()
  const options = [
    { label: t.days.someday, value: '' },
    { label: t.days.today, value: todayKey },
    { label: t.days.tomorrow, value: toDateKey(addDays(parseDateKey(todayKey), 1)) },
  ]

  return (
    <div className="task-field">
      <span className="task-field__label" id={labelId}>
        {t.fields.plannedFor}
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
          label={t.fields.otherDay}
          placeholder={t.fields.otherDayPlaceholder}
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
  const { t } = useI18n()
  return (
    <div className="task-field">
      <span className="task-field__label">{t.fields.deadline}</span>
      <div className="task-field__row">
        <DateField label={t.fields.deadlineShort} placeholder={t.fields.noDeadline} value={value} onChange={onChange} todayKey={todayKey} />
        {value && (
          <button type="button" className="button button--secondary" onClick={() => onChange('')}>
            {t.fields.noDeadline}
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
  const { t } = useI18n()
  return (
    <button
      type="button"
      className="chip task-field__important"
      aria-pressed={value}
      onClick={() => onChange(!value)}
    >
      <Icon name="flag" size={14} /> {t.common.important}
    </button>
  )
}

/** Auswahl für die Erinnerung: Minuten vor der Uhrzeit, `undefined` = keine Erinnerung */
const REMINDER_OPTIONS = [undefined, 0, 10, 30, 60, 24 * 60] as const

interface TimeFieldProps {
  /** Uhrzeit als "HH:MM", leerer Text = keine Uhrzeit */
  time: string
  reminder: number | undefined
  onTimeChange: (value: string) => void
  onReminderChange: (value: number | undefined) => void
}

/** Uhrzeit am geplanten Tag und, sobald eine Uhrzeit gewählt ist, die Erinnerung dazu. */
export function TimeField({ time, reminder, onTimeChange, onReminderChange }: TimeFieldProps) {
  const { t } = useI18n()
  const reminderLabelId = useId()
  return (
    <div className="task-field">
      <label className="task-field">
        <span className="task-field__label">{t.fields.time}</span>
        <span className="task-field__row">
          <input
            className="field task-field__time"
            type="time"
            value={time}
            onChange={(event) => onTimeChange(event.target.value)}
          />
          {time && (
            <button type="button" className="button button--secondary" onClick={() => onTimeChange('')}>
              {t.fields.noTime}
            </button>
          )}
        </span>
      </label>
      {time && (
        <>
          <span className="task-field__label" id={reminderLabelId}>
            {t.fields.reminder}
          </span>
          <div className="chips" role="radiogroup" aria-labelledby={reminderLabelId}>
            {REMINDER_OPTIONS.map((minutes) => (
              <button
                key={minutes ?? 'keine'}
                type="button"
                role="radio"
                aria-checked={reminder === minutes}
                className="chip"
                onClick={() => onReminderChange(minutes)}
              >
                {t.fields.reminderOption(minutes)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

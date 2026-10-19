import { useState } from 'react'
import { formatFullDate, getMonthGrid, parseDateKey } from '../tasks/dates'
import { Icon } from './Icon'
import './DateField.css'

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

interface DateFieldProps {
  /** Gewähltes Datum als "JJJJ-MM-TT", leerer Text = kein Datum */
  value: string
  onChange: (value: string) => void
  todayKey: string
  label: string
  placeholder?: string
}

/**
 * Eigenes Datumsfeld mit Kalender im Design der App.
 * Ein Tipp auf das Feld klappt den Kalender auf, ein Tipp auf einen Tag wählt ihn aus.
 * (Der eingebaute Kalender des Browsers lässt sich kaum gestalten und zeigt je nach Gerät andere Formate.)
 */
export function DateField({ value, onChange, todayKey, label, placeholder = 'Datum wählen' }: DateFieldProps) {
  const [isOpen, setOpen] = useState(false)
  const start = parseDateKey(value || todayKey)
  const [shownYear, setShownYear] = useState(start.getFullYear())
  const [shownMonth, setShownMonth] = useState(start.getMonth())

  function openCalendar() {
    // Beim Öffnen den Monat des gewählten Datums zeigen
    const date = parseDateKey(value || todayKey)
    setShownYear(date.getFullYear())
    setShownMonth(date.getMonth())
    setOpen(!isOpen)
  }

  function changeMonth(step: number) {
    const date = new Date(shownYear, shownMonth + step, 1)
    setShownYear(date.getFullYear())
    setShownMonth(date.getMonth())
  }

  const monthTitle = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(
    new Date(shownYear, shownMonth, 1),
  )

  return (
    <div className="date-field">
      <button
        type="button"
        className={`field date-field__button${value ? '' : ' date-field__button--empty'}`}
        aria-label={`${label}: ${value ? formatFullDate(value) : 'kein Datum'}`}
        aria-expanded={isOpen}
        onClick={openCalendar}
      >
        <Icon name="calendar" size={18} />
        {value ? formatFullDate(value) : placeholder}
      </button>

      {isOpen && (
        <div className="calendar" role="group" aria-label={`Kalender ${label}`}>
          <div className="calendar__header">
            <button type="button" className="calendar__nav" aria-label="Vorheriger Monat" onClick={() => changeMonth(-1)}>
              <Icon name="chevronLeft" size={18} />
            </button>
            <span className="calendar__title">{monthTitle}</span>
            <button type="button" className="calendar__nav" aria-label="Nächster Monat" onClick={() => changeMonth(1)}>
              <Icon name="chevronRight" size={18} />
            </button>
          </div>

          <div className="calendar__grid">
            {WEEKDAYS.map((day) => (
              <span key={day} className="calendar__weekday">
                {day}
              </span>
            ))}
            {getMonthGrid(shownYear, shownMonth).map((dateKey, index) =>
              dateKey === null ? (
                <span key={`leer-${index}`} />
              ) : (
                <button
                  key={dateKey}
                  type="button"
                  className={[
                    'calendar__day',
                    dateKey === todayKey ? 'calendar__day--today' : '',
                    dateKey < todayKey ? 'calendar__day--past' : '',
                  ].join(' ')}
                  aria-label={formatFullDate(dateKey)}
                  aria-pressed={dateKey === value}
                  onClick={() => {
                    onChange(dateKey)
                    setOpen(false)
                  }}
                >
                  {parseDateKey(dateKey).getDate()}
                </button>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  )
}

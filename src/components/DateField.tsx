import { useState } from 'react'
import { formatFullDate, formatMonthYear, getMonthGrid, getWeekdayNames, parseDateKey } from '../tasks/dates'
import { Icon } from './Icon'
import './DateField.css'
import { useI18n } from '../i18n/useI18n'

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
export function DateField({ value, onChange, todayKey, label, placeholder }: DateFieldProps) {
  const { t } = useI18n()
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

  const monthTitle = formatMonthYear(shownYear, shownMonth, t.locale)

  return (
    <div className="date-field">
      <button
        type="button"
        className={`field date-field__button${value ? '' : ' date-field__button--empty'}`}
        aria-label={`${label}: ${value ? formatFullDate(value, t.locale) : t.fields.noDate}`}
        aria-expanded={isOpen}
        onClick={openCalendar}
      >
        <Icon name="calendar" size={18} />
        {value ? formatFullDate(value, t.locale) : (placeholder ?? t.fields.pickDate)}
      </button>

      {isOpen && (
        <div className="calendar" role="group" aria-label={t.fields.calendar(label)}>
          <div className="calendar__header">
            <button type="button" className="calendar__nav" aria-label={t.fields.prevMonth} onClick={() => changeMonth(-1)}>
              <Icon name="chevronLeft" size={18} />
            </button>
            <span className="calendar__title">{monthTitle}</span>
            <button type="button" className="calendar__nav" aria-label={t.fields.nextMonth} onClick={() => changeMonth(1)}>
              <Icon name="chevronRight" size={18} />
            </button>
          </div>

          <div className="calendar__grid">
            {getWeekdayNames(t.locale).map((day) => (
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
                  aria-label={formatFullDate(dateKey, t.locale)}
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

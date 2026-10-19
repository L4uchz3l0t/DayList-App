import { addDays, formatWeekdayDate, parseDateKey, toDateKey } from '../tasks/dates'
import type { Task } from '../tasks/types'
import { DateField } from './DateField'
import { Sheet } from './Sheet'
import './MoveSheet.css'
import { useI18n } from '../i18n/useI18n'

interface MoveSheetProps {
  task: Task
  todayKey: string
  /** Neuer Tag als "JJJJ-MM-TT", leerer Text = zurück zu Irgendwann */
  onMove: (plannedDate: string) => void
  onClose: () => void
  /** Das Fenster blendet gerade aus */
  closing?: boolean
}

/**
 * Schnelles Verschieben: ein Tipp auf einen Tag der nächsten Woche genügt.
 * Für spätere Tage gibt es den Kalender.
 */
export function MoveSheet({ task, todayKey, onMove, onClose, closing }: MoveSheetProps) {
  const { t } = useI18n()
  const start = parseDateKey(todayKey)
  const days = Array.from({ length: 7 }, (_, index) => {
    const dateKey = toDateKey(addDays(start, index))
    const label = index === 0 ? t.days.today : index === 1 ? t.days.tomorrow : formatWeekdayDate(dateKey, t.locale)
    return { dateKey, label }
  })
  const current = task.plannedDate ?? ''

  return (
    <Sheet title={task.plannedDate ? t.move.titleMove : t.move.titleSchedule} onClose={onClose} closing={closing}>
      <p className="move-sheet__task">„{task.title}“</p>
      <div className="move-sheet__days" role="radiogroup" aria-label={t.move.newDay}>
        {days.map((day) => (
          <button
            key={day.dateKey}
            type="button"
            role="radio"
            aria-checked={current === day.dateKey}
            className="chip"
            onClick={() => onMove(day.dateKey)}
          >
            {day.label}
          </button>
        ))}
        <button
          type="button"
          role="radio"
          aria-checked={current === ''}
          className="chip"
          onClick={() => onMove('')}
        >
          {t.days.someday}
        </button>
      </div>
      <DateField
        label={t.fields.otherDay}
        placeholder={t.fields.otherDayPlaceholder}
        value={days.some((day) => day.dateKey === current) ? '' : current}
        onChange={onMove}
        todayKey={todayKey}
      />
    </Sheet>
  )
}

import { addDays, formatWeekdayDate, parseDateKey, toDateKey } from '../tasks/dates'
import type { Task } from '../tasks/types'
import { DateField } from './DateField'
import { Sheet } from './Sheet'
import './MoveSheet.css'

interface MoveSheetProps {
  task: Task
  todayKey: string
  /** Neuer Tag als "JJJJ-MM-TT", leerer Text = zurück zu Irgendwann */
  onMove: (plannedDate: string) => void
  onClose: () => void
}

/**
 * Schnelles Verschieben: ein Tipp auf einen Tag der nächsten Woche genügt.
 * Für spätere Tage gibt es den Kalender.
 */
export function MoveSheet({ task, todayKey, onMove, onClose }: MoveSheetProps) {
  const start = parseDateKey(todayKey)
  const days = Array.from({ length: 7 }, (_, index) => {
    const dateKey = toDateKey(addDays(start, index))
    const label = index === 0 ? 'Heute' : index === 1 ? 'Morgen' : formatWeekdayDate(dateKey)
    return { dateKey, label }
  })
  const current = task.plannedDate ?? ''

  return (
    <Sheet title={task.plannedDate ? 'Verschieben' : 'Einplanen'} onClose={onClose}>
      <p className="move-sheet__task">„{task.title}“</p>
      <div className="move-sheet__days" role="radiogroup" aria-label="Neuer Tag">
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
          Irgendwann
        </button>
      </div>
      <DateField
        label="Anderer Tag"
        placeholder="Anderer Tag …"
        value={days.some((day) => day.dateKey === current) ? '' : current}
        onChange={onMove}
        todayKey={todayKey}
      />
    </Sheet>
  )
}

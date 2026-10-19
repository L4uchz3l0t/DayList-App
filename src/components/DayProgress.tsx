import './DayProgress.css'

interface DayProgressProps {
  done: number
  total: number
}

/** Fortschrittsbalken: wie viele Aufgaben für heute schon erledigt sind. */
export function DayProgress({ done, total }: DayProgressProps) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  const label = total === 0 ? 'Für heute ist nichts geplant' : `${done} von ${total} erledigt`

  return (
    <div className="day-progress">
      <div className="day-progress__label">{label}</div>
      <div
        className="day-progress__track"
        role="progressbar"
        aria-label="Fortschritt heute"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div className="day-progress__bar" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

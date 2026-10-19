import './DayProgress.css'
import { useI18n } from '../i18n/useI18n'

interface DayProgressProps {
  done: number
  total: number
}

/** Fortschrittskarte: wie viele Aufgaben für heute schon erledigt sind. */
export function DayProgress({ done, total }: DayProgressProps) {
  const { t } = useI18n()
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  const label = total === 0 ? t.progress.nothingPlanned : t.progress.count(done, total)

  return (
    <div className="day-progress">
      <div className="day-progress__row">
        <span className="day-progress__label">{label}</span>
        {total > 0 && <span className="day-progress__percent">{percent} %</span>}
      </div>
      <div
        className="day-progress__track"
        role="progressbar"
        aria-label={t.progress.label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div className="day-progress__bar" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

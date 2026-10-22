import { Icon } from '../../components/Icon'
import { useI18n } from '../../i18n/useI18n'
import { formatWeekdayDate } from '../../tasks/dates'
import type { GroupTask } from '../types'

interface GroupTaskRowProps {
  task: GroupTask
  /** Name der zugeteilten Person (für die vorgelesene Beschriftung) */
  assigneeName: string
  todayKey: string
  /** Abhaken erlaubt: eigene Aufgabe oder Verwalter */
  canToggle: boolean
  onToggle: () => void
  /** Bearbeiten (nur Verwalter); ohne bleibt der Text nur Text */
  onEdit?: () => void
  /** Kleinere Darstellung unter "Die anderen" */
  compact?: boolean
}

/** Eine Aufgabe in einer Gruppe: Haken, Titel, Frist, Uhrzeit und Wiederholung */
export function GroupTaskRow({ task, assigneeName, todayKey, canToggle, onToggle, onEdit, compact }: GroupTaskRowProps) {
  const { t } = useI18n()
  const done = task.done_at !== null
  const late = !done && task.due_date < todayKey
  const dueText = task.due_date === todayKey ? t.days.today.toLowerCase() : formatWeekdayDate(task.due_date, t.locale)

  const body = (
    <>
      <span className="group-task__title">{task.title}</span>
      <span className="group-task__meta">
        <span className={`group-tag${late ? ' group-tag--warning' : ''}`}>{t.groups.due(dueText)}</span>
        {task.time && (
          <span className="group-tag group-tag--success">
            <Icon name={task.reminder !== null ? 'bell' : 'clock'} size={12} /> {t.task.at(task.time)}
          </span>
        )}
        {task.series_id && !compact && (
          <span className="group-tag group-tag--success">
            <Icon name="repeat" size={12} />
          </span>
        )}
      </span>
    </>
  )

  return (
    <li className={`group-task${done ? ' group-task--done' : ''}${compact ? ' group-task--compact' : ''}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? t.groups.reopen(task.title, assigneeName) : t.groups.complete(task.title, assigneeName)}
        className="group-task__check"
        disabled={!canToggle}
        onClick={onToggle}
      >
        {done && <Icon name="check" size={compact ? 12 : 16} />}
      </button>
      {onEdit ? (
        <button type="button" className="group-task__body" onClick={onEdit}>
          {body}
        </button>
      ) : (
        <span className="group-task__body">{body}</span>
      )}
    </li>
  )
}

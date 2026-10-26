import { formatShortDate } from '../tasks/dates'
import { describePlannedDay, isOverdue as checkOverdue } from '../tasks/taskViews'
import type { Task } from '../tasks/types'
import type { DraggableSyntheticListeners } from '@dnd-kit/core'
import { Icon } from './Icon'
import './TaskItem.css'
import { useI18n } from '../i18n/useI18n'

interface TaskItemProps {
  task: Task
  todayKey: string
  onToggle: (id: string) => void
  onOpen: (id: string) => void
  /** Zeigt bei offenen Aufgaben einen Knopf zum Verschieben auf einen anderen Tag */
  onMove?: (id: string) => void
  /** Geplanten Tag als Etikett zeigen (zum Beispiel in "Alle", wo Aufgaben verschiedener Tage gemischt sind) */
  showPlannedDate?: boolean
  /** Nur in der Woche: macht die Karte zum Ziehen und Ablegen bereit (siehe DraggableTaskItem) */
  drag?: {
    setNodeRef: (element: HTMLElement | null) => void
    listeners: DraggableSyntheticListeners
    isDragging: boolean
  }
}

/**
 * Eine Zeile in der Aufgabenliste. Ein Tipp auf den Kreis erledigt die Aufgabe,
 * ein Tipp auf den Text öffnet die Detailansicht.
 * Überfällige Aufgaben zeigen immer nur ihren ursprünglich geplanten Tag.
 * Die Frist erscheint nicht in der Liste, sondern später in der Detailansicht.
 */
export function TaskItem({ task, todayKey, onToggle, onOpen, onMove, showPlannedDate = false, drag }: TaskItemProps) {
  const { t } = useI18n()
  const isEvent = task.kind === 'event'
  const isDone = task.status === 'done' && !isEvent
  const isOverdue = checkOverdue(task, todayKey)
  const showDate = showPlannedDate && !isOverdue && task.plannedDate !== undefined
  // Termine zeigen ihre Uhrzeit links statt des Hakens
  const showTime = task.time !== undefined && task.plannedDate !== undefined && !isDone && !isEvent
  const showReminder = isEvent && task.time !== undefined && task.reminder !== undefined

  return (
    <li
      ref={drag?.setNodeRef}
      className={`task-item${isEvent ? ' task-item--event' : ''}${isDone ? ' task-item--done' : ''}${drag ? ' task-item--draggable' : ''}${drag?.isDragging ? ' task-item--dragging' : ''}`}
      {...drag?.listeners}
    >
      {isEvent ? (
        <span className="task-item__when">
          {task.time ?? t.task.allDay}
          {task.google?.endTime && <span className="task-item__until">{task.google.endTime}</span>}
        </span>
      ) : (
        <button
          type="button"
          role="checkbox"
          aria-checked={isDone}
          aria-label={isDone ? t.task.reopen(task.title) : t.task.complete(task.title)}
          className="task-item__check"
          onClick={() => onToggle(task.id)}
        >
          {isDone && <Icon name="check" size={16} />}
        </button>
      )}

      <button type="button" className="task-item__body" onClick={() => onOpen(task.id)}>
        <span className="task-item__title">{task.title}</span>
        {(isOverdue || showDate || showTime || showReminder || task.repeat || task.group || task.google) && (
          <span className="task-item__meta">
            {isOverdue && task.plannedDate && (
              <span className="task-item__tag task-item__tag--overdue">
                {t.task.plannedOn(formatShortDate(task.plannedDate, t.locale))}
              </span>
            )}
            {showDate && (
              <span className="task-item__tag task-item__tag--date">
                {describePlannedDay(task.plannedDate, todayKey, t.days, t.locale)}
              </span>
            )}
            {showTime && (
              <span className="task-item__tag task-item__tag--time">
                <Icon name={task.reminder !== undefined ? 'bell' : 'clock'} size={12} /> {t.task.at(task.time!)}
                {task.reminder !== undefined && <span className="visually-hidden">, {t.task.withReminder}</span>}
              </span>
            )}
            {task.repeat && (
              <span className="task-item__tag task-item__tag--repeat">
                <Icon name="repeat" size={12} /> {t.fields.repeatNames[task.repeat]}
              </span>
            )}
            {task.group && (
              <span className="task-item__tag task-item__tag--group">
                <Icon name="groups" size={12} /> {t.groups.groupTag(task.group.name)}
              </span>
            )}
            {showReminder && (
              <span className="task-item__tag task-item__tag--time">
                <Icon name="bell" size={12} />
                <span className="visually-hidden">{t.task.withReminder}</span>
              </span>
            )}
            {task.google && (
              <span className="task-item__tag task-item__tag--google">
                {task.google.calendar}
                {task.google.location && ` · ${task.google.location}`}
              </span>
            )}
          </span>
        )}
      </button>

      {/* Gruppenaufgaben verschiebt nur ein Verwalter in der Gruppe selbst */}
      {onMove && !isDone && !task.group && !task.google && (
        <button
          type="button"
          className="task-item__move"
          aria-label={task.plannedDate ? t.task.move(task.title) : t.task.schedule(task.title)}
          title={task.plannedDate ? t.task.moveShort : t.task.scheduleShort}
          onClick={() => onMove(task.id)}
        >
          <Icon name="move" size={20} />
        </button>
      )}
    </li>
  )
}

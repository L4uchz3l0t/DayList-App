import { formatShortDate } from '../tasks/dates'
import { describePlannedDay, isOverdue as checkOverdue } from '../tasks/taskViews'
import type { Task } from '../tasks/types'
import type { DraggableSyntheticListeners } from '@dnd-kit/core'
import { Icon } from './Icon'
import './TaskItem.css'

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
export function TaskItem({
  task,
  todayKey,
  onToggle,
  onOpen,
  onMove,
  showPlannedDate = false,
  drag,
}: TaskItemProps) {
  const isDone = task.status === 'done'
  const isOverdue = checkOverdue(task, todayKey)
  // "Wichtig" ist bei Überfälligem überflüssig, die rote Markierung reicht
  const showPriority = task.priority === 'high' && !isOverdue
  const showDate = showPlannedDate && !isOverdue && task.plannedDate !== undefined

  return (
    <li
      ref={drag?.setNodeRef}
      className={`task-item${isDone ? ' task-item--done' : ''}${drag ? ' task-item--draggable' : ''}${drag?.isDragging ? ' task-item--dragging' : ''}`}
      {...drag?.listeners}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={isDone}
        aria-label={isDone ? `„${task.title}“ wieder öffnen` : `„${task.title}“ erledigen`}
        className="task-item__check"
        onClick={() => onToggle(task.id)}
      >
        {isDone && <Icon name="check" size={16} />}
      </button>

      <button type="button" className="task-item__body" onClick={() => onOpen(task.id)}>
        <span className="task-item__title">{task.title}</span>
        {(isOverdue || showPriority || showDate) && (
          <span className="task-item__meta">
            {isOverdue && task.plannedDate && (
              <span className="task-item__tag task-item__tag--overdue">
                geplant {formatShortDate(task.plannedDate)}
              </span>
            )}
            {showDate && (
              <span className="task-item__tag task-item__tag--date">
                {describePlannedDay(task.plannedDate, todayKey)}
              </span>
            )}
            {showPriority && (
              <span className="task-item__tag task-item__tag--priority">
                <Icon name="flag" size={12} /> Wichtig
              </span>
            )}
          </span>
        )}
      </button>

      {onMove && !isDone && (
        <button
          type="button"
          className="task-item__move"
          aria-label={task.plannedDate ? `„${task.title}“ verschieben` : `„${task.title}“ einplanen`}
          title={task.plannedDate ? 'Verschieben' : 'Einplanen'}
          onClick={() => onMove(task.id)}
        >
          <Icon name="move" size={20} />
        </button>
      )}
    </li>
  )
}

import { formatDayLabel } from '../tasks/dates'
import type { Task } from '../tasks/types'
import { Icon } from './Icon'
import './TaskItem.css'

interface TaskItemProps {
  task: Task
  todayKey: string
  onToggle: (id: string) => void
}

/**
 * Eine Aufgabe als Karte. Ein Tipp auf den Kreis erledigt die Aufgabe.
 * Rechts stehen übereinander die Etiketten (wichtig, ursprünglich geplant, Frist).
 */
export function TaskItem({ task, todayKey, onToggle }: TaskItemProps) {
  const isDone = task.status === 'done'
  const isOverdue = !isDone && task.plannedDate !== undefined && task.plannedDate < todayKey
  const isHighPriority = task.priority === 'high'
  const hasTags = isHighPriority || isOverdue || task.dueDate !== undefined

  return (
    <li className={`task-item${isDone ? ' task-item--done' : ''}`}>
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

      <span className="task-item__title">{task.title}</span>

      {hasTags && (
        <span className="task-item__tags">
          {isHighPriority && (
            <span className="task-item__tag task-item__tag--priority">
              <Icon name="flag" size={14} /> Wichtig
            </span>
          )}
          {isOverdue && task.plannedDate && (
            <span className="task-item__tag task-item__tag--overdue">
              <span className="task-item__tag-label">Geplant</span>
              <span className="task-item__tag-value">{formatDayLabel(task.plannedDate, todayKey)}</span>
            </span>
          )}
          {task.dueDate && (
            <span className="task-item__tag task-item__tag--due">
              <span className="task-item__tag-label">Frist</span>
              <span className="task-item__tag-value">{formatDayLabel(task.dueDate, todayKey)}</span>
            </span>
          )}
        </span>
      )}
    </li>
  )
}

import { formatShortDate } from '../tasks/dates'
import type { Task } from '../tasks/types'
import { Icon } from './Icon'
import './TaskItem.css'

interface TaskItemProps {
  task: Task
  todayKey: string
  onToggle: (id: string) => void
}

/** Eine Zeile in der Aufgabenliste. Ein Tipp auf den Kreis erledigt die Aufgabe. */
export function TaskItem({ task, todayKey, onToggle }: TaskItemProps) {
  const isDone = task.status === 'done'
  const isOverdue = !isDone && task.plannedDate !== undefined && task.plannedDate < todayKey
  const isHighPriority = task.priority === 'high'

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

      <div className="task-item__body">
        <span className="task-item__title">{task.title}</span>
        {(isOverdue || task.dueDate || isHighPriority) && (
          <span className="task-item__meta">
            {isOverdue && task.plannedDate && (
              <span className="task-item__tag task-item__tag--overdue">
                geplant {formatShortDate(task.plannedDate)}
              </span>
            )}
            {task.dueDate && (
              <span className="task-item__tag task-item__tag--due">
                Frist {formatShortDate(task.dueDate)}
              </span>
            )}
            {isHighPriority && (
              <span className="task-item__tag task-item__tag--priority">
                <Icon name="flag" size={12} /> Wichtig
              </span>
            )}
          </span>
        )}
      </div>
    </li>
  )
}

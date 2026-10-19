import type { ReactNode } from 'react'
import type { Task } from '../tasks/types'
import { TaskItem } from './TaskItem'
import './TaskSection.css'

interface TaskSectionProps {
  title: string
  tasks: Task[]
  todayKey: string
  onToggle: (id: string) => void
  tone?: 'default' | 'danger'
  /** Angezeigte Anzahl, falls sie von der sichtbaren Liste abweicht (zum Beispiel bei ausgeblendeten Aufgaben) */
  count?: number
  /** Optionaler Inhalt rechts neben der Überschrift, zum Beispiel ein Knopf */
  action?: ReactNode
}

/** Eine Überschrift mit einer Liste von Aufgaben darunter. */
export function TaskSection({ title, tasks, todayKey, onToggle, tone = 'default', count, action }: TaskSectionProps) {
  return (
    <section className="task-section">
      <div className="task-section__header">
        <h2 className={`task-section__title task-section__title--${tone}`}>
          {title} <span className="task-section__count">{count ?? tasks.length}</span>
        </h2>
        {action}
      </div>
      {tasks.length > 0 && (
        <ul className="task-section__list">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} todayKey={todayKey} onToggle={onToggle} />
          ))}
        </ul>
      )}
    </section>
  )
}

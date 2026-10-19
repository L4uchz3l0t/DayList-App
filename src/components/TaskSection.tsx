import type { ReactNode } from 'react'
import type { Task } from '../tasks/types'
import { TaskItem } from './TaskItem'
import './TaskSection.css'

/** Farbe eines Bereichs: Rot für Überfälliges, Violett für Geplantes, Grün für Erledigtes */
export type SectionTone = 'danger' | 'accent' | 'success'

interface TaskSectionProps {
  title: string
  tasks: Task[]
  todayKey: string
  onToggle: (id: string) => void
  onOpen: (id: string) => void
  tone?: SectionTone
  /** Angezeigte Anzahl, falls sie von der sichtbaren Liste abweicht (zum Beispiel bei ausgeblendeten Aufgaben) */
  count?: number
  /** Optionaler Inhalt rechts neben der Überschrift, zum Beispiel ein Knopf */
  action?: ReactNode
}

/** Eine Überschrift mit einer Liste von Aufgaben darunter. */
export function TaskSection({ title, tasks, todayKey, onToggle, onOpen, tone = 'accent', count, action }: TaskSectionProps) {
  return (
    <section className={`task-section task-section--${tone}`}>
      <div className="task-section__header">
        <h2 className="task-section__title">
          <span className="task-section__dot" aria-hidden="true" />
          {title} <span className="task-section__count">{count ?? tasks.length}</span>
        </h2>
        {action}
      </div>
      {tasks.length > 0 && (
        <ul className="task-section__list">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} todayKey={todayKey} onToggle={onToggle} onOpen={onOpen} />
          ))}
        </ul>
      )}
    </section>
  )
}

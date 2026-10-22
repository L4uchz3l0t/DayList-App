import type { ReactNode } from 'react'
import type { Task } from '../tasks/types'
import { DraggableTaskItem } from './DraggableTaskItem'
import { Icon } from './Icon'
import { TaskItem } from './TaskItem'
import { useCollapsed } from './useCollapsed'
import './TaskSection.css'

/** Farbe eines Bereichs: Rot für Überfälliges, Violett für Aufgaben, Blau für Termine, Grün für Erledigtes */
export type SectionTone = 'danger' | 'accent' | 'event' | 'success'

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
  onMove?: (id: string) => void
  showPlannedDate?: boolean
  /** Zusätzlicher Inhalt unter der Liste, zum Beispiel ein Hinweis oder Fristen */
  children?: ReactNode
  /** Überschrift antippen klappt den Bereich ein und aus. Der Zustand wird unter `storageKey` gemerkt. */
  collapsible?: { storageKey: string; defaultCollapsed?: boolean }
  /** Karten lassen sich ziehen (nur innerhalb eines DndContext, zum Beispiel in der Woche) */
  draggable?: boolean
}

/** Eine Überschrift mit einer Liste von Aufgaben darunter. */
export function TaskSection({
  title,
  tasks,
  todayKey,
  onToggle,
  onOpen,
  tone = 'accent',
  count,
  action,
  onMove,
  showPlannedDate,
  children,
  collapsible,
  draggable = false,
}: TaskSectionProps) {
  const [isCollapsed, toggleCollapsed] = useCollapsed(
    collapsible?.storageKey ?? '',
    collapsible?.defaultCollapsed ?? false,
  )
  const collapsed = collapsible !== undefined && isCollapsed

  const Item = draggable ? DraggableTaskItem : TaskItem

  const heading = (
    <>
      <span className="task-section__dot" aria-hidden="true" />
      {title} <span className="task-section__count">{count ?? tasks.length}</span>
    </>
  )

  const content = (
    <>
      {tasks.length > 0 && (
        <ul className="task-section__list">
          {tasks.map((task) => (
            <Item
              key={task.id}
              task={task}
              todayKey={todayKey}
              onToggle={onToggle}
              onOpen={onOpen}
              onMove={onMove}
              showPlannedDate={showPlannedDate}
            />
          ))}
        </ul>
      )}
      {children}
    </>
  )

  return (
    <section className={`task-section task-section--${tone}`}>
      <div className="task-section__header">
        <h2 className="task-section__title">
          {collapsible ? (
            <button
              type="button"
              className="task-section__collapse"
              aria-expanded={!collapsed}
              onClick={toggleCollapsed}
            >
              {heading}
              <span className="task-section__chevron" aria-hidden="true">
                <Icon name="chevronDown" size={20} />
              </span>
            </button>
          ) : (
            heading
          )}
        </h2>
        {action}
      </div>
      {collapsible ? (
        // Bleibt im Dokument, damit Auf- und Zuklappen weich animiert werden kann
        <div className="task-section__body" data-collapsed={collapsed} inert={collapsed}>
          <div className="task-section__inner">{content}</div>
        </div>
      ) : (
        content
      )}
    </section>
  )
}

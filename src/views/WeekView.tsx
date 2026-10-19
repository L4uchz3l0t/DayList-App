import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useRef, useState, type ReactNode } from 'react'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { TaskItem } from '../components/TaskItem'
import { TaskSection } from '../components/TaskSection'
import { formatShortDate, formatWeekday, formatWeekdayDate } from '../tasks/dates'
import { getOverdueTasks, getWeekDays } from '../tasks/taskViews'
import type { Task } from '../tasks/types'
import './views.css'

interface WeekViewProps {
  tasks: Task[]
  todayKey: string
  onToggle: (id: string) => void
  onOpen: (id: string) => void
  onMove: (id: string) => void
  /** Aufgabe direkt auf einen Tag legen (nach dem Ziehen und Ablegen) */
  onMoveTo: (id: string, plannedDate: string) => void
  /** Schnellaufnahme mit diesem Tag öffnen */
  onAdd: (plannedDate: string) => void
}

/** Ein Tag als Ablagefläche: Wird eine Karte darüber gezogen, leuchtet er auf. */
function DropDay({ dateKey, children }: { dateKey: string; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: dateKey })
  return (
    <div ref={setNodeRef} className={`week-view__day${isOver ? ' week-view__day--over' : ''}`}>
      {children}
    </div>
  )
}

/**
 * Die nächsten sieben Tage untereinander, Überfälliges ganz oben.
 * Aufgaben lassen sich auf einen anderen Tag ziehen: am Computer mit der Maus,
 * auf dem Handy nach kurzem Gedrückthalten (damit normales Scrollen weiter funktioniert).
 */
export function WeekView({ tasks, todayKey, onToggle, onOpen, onMove, onMoveTo, onAdd }: WeekViewProps) {
  const overdue = getOverdueTasks(tasks, todayKey)
  const days = getWeekDays(tasks, todayKey)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const draggedTask = tasks.find((task) => task.id === draggedId)
  // Nach dem Ablegen auf derselben Karte würde der Browser sonst noch einen Tipp auslösen
  const lastDropAt = useRef(0)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  )

  const titleOf = (id: string | number) => tasks.find((task) => task.id === id)?.title ?? 'Aufgabe'
  const dayOf = (id: string | number) => formatWeekdayDate(String(id))
  const announcements: Announcements = {
    onDragStart: ({ active }) => `„${titleOf(active.id)}“ aufgenommen.`,
    onDragOver: ({ active, over }) => (over ? `„${titleOf(active.id)}“ über ${dayOf(over.id)}.` : undefined),
    onDragEnd: ({ active, over }) =>
      over ? `„${titleOf(active.id)}“ auf ${dayOf(over.id)} gelegt.` : `„${titleOf(active.id)}“ nicht verschoben.`,
    onDragCancel: ({ active }) => `Verschieben von „${titleOf(active.id)}“ abgebrochen.`,
  }

  function handleDragStart(event: DragStartEvent) {
    setDraggedId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggedId(null)
    lastDropAt.current = Date.now()
    if (event.over) onMoveTo(String(event.active.id), String(event.over.id))
  }

  const recentlyDropped = () => Date.now() - lastDropAt.current < 100
  const guardedOpen = (id: string) => !recentlyDropped() && onOpen(id)
  const guardedToggle = (id: string) => !recentlyDropped() && onToggle(id)
  const sectionProps = { todayKey, onToggle: guardedToggle, onOpen: guardedOpen, onMove, draggable: true }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggedId(null)}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable: 'Zum Verschieben lieber den Kalender-Knopf rechts an der Aufgabe verwenden.',
        },
      }}
    >
      {overdue.length > 0 && <TaskSection title="Überfällig" tone="danger" tasks={overdue} {...sectionProps} />}

      {days.map((day, index) => {
        const name = index === 0 ? 'Heute' : index === 1 ? 'Morgen' : formatWeekday(day.dateKey)
        const openCount = day.tasks.filter((task) => task.status === 'open').length
        return (
          <DropDay key={day.dateKey} dateKey={day.dateKey}>
            <TaskSection
              title={`${name} · ${formatShortDate(day.dateKey)}`}
              tasks={day.tasks}
              count={openCount}
              {...sectionProps}
              action={
                <button
                  type="button"
                  className="week-view__add"
                  aria-label={`Aufgabe für ${formatWeekdayDate(day.dateKey)} hinzufügen`}
                  onClick={() => onAdd(day.dateKey)}
                >
                  <Icon name="plus" size={20} />
                </button>
              }
            >
              {day.tasks.length === 0 && (
                <EmptyState
                  title={draggedId ? 'Hier ablegen' : 'Nichts geplant'}
                  compact
                  onClick={() => onAdd(day.dateKey)}
                />
              )}
              {day.deadlines.map((task) => (
                <button key={task.id} type="button" className="week-view__deadline" onClick={() => onOpen(task.id)}>
                  <Icon name="clock" size={16} />
                  <span>
                    Frist: <strong>{task.title}</strong>
                  </span>
                </button>
              ))}
            </TaskSection>
          </DropDay>
        )
      })}

      <DragOverlay dropAnimation={null}>
        {draggedTask && (
          <ul className="week-view__overlay task-section--accent">
            <TaskItem task={draggedTask} todayKey={todayKey} onToggle={() => {}} onOpen={() => {}} />
          </ul>
        )}
      </DragOverlay>
    </DndContext>
  )
}

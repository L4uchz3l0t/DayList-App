import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
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
  /** Schnellaufnahme mit diesem Tag öffnen */
  onAdd: (plannedDate: string) => void
}

/** Die nächsten sieben Tage untereinander, Überfälliges ganz oben. */
export function WeekView({ tasks, todayKey, onToggle, onOpen, onMove, onAdd }: WeekViewProps) {
  const overdue = getOverdueTasks(tasks, todayKey)
  const days = getWeekDays(tasks, todayKey)

  return (
    <div>
      {overdue.length > 0 && (
        <TaskSection
          title="Überfällig"
          tone="danger"
          tasks={overdue}
          todayKey={todayKey}
          onToggle={onToggle}
          onOpen={onOpen}
          onMove={onMove}
        />
      )}

      {days.map((day, index) => {
        const name = index === 0 ? 'Heute' : index === 1 ? 'Morgen' : formatWeekday(day.dateKey)
        const openCount = day.tasks.filter((task) => task.status === 'open').length
        return (
          <TaskSection
            key={day.dateKey}
            title={`${name} · ${formatShortDate(day.dateKey)}`}
            tasks={day.tasks}
            count={openCount}
            todayKey={todayKey}
            onToggle={onToggle}
            onOpen={onOpen}
            onMove={onMove}
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
              <EmptyState title="Nichts geplant" compact onClick={() => onAdd(day.dateKey)} />
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
        )
      })}
    </div>
  )
}

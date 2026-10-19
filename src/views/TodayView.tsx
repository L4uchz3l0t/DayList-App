import { useState } from 'react'
import { DayProgress } from '../components/DayProgress'
import { TaskSection } from '../components/TaskSection'
import type { Task } from '../tasks/types'
import './TodayView.css'

interface TodayViewProps {
  tasks: Task[]
  todayKey: string
  onToggle: (id: string) => void
  onOpen: (id: string) => void
}

/** Wichtige Aufgaben zuerst, sonst bleibt die Reihenfolge erhalten. */
function byPriority(a: Task, b: Task): number {
  return Number(b.priority === 'high') - Number(a.priority === 'high')
}

export function TodayView({ tasks, todayKey, onToggle, onOpen }: TodayViewProps) {
  const [showDone, setShowDone] = useState(false)

  const overdue = tasks
    .filter((t) => t.status === 'open' && t.plannedDate !== undefined && t.plannedDate < todayKey)
    .sort(byPriority)
  const plannedToday = tasks.filter((t) => t.plannedDate === todayKey)
  const openToday = plannedToday.filter((t) => t.status === 'open').sort(byPriority)
  const doneToday = plannedToday.filter((t) => t.status === 'done')

  const nothingOpen = overdue.length === 0 && openToday.length === 0

  return (
    <div className="today-view">
      <DayProgress done={doneToday.length} total={plannedToday.length} />

      {overdue.length > 0 && (
        <TaskSection
          title="Überfällig"
          tone="danger"
          tasks={overdue}
          todayKey={todayKey}
          onToggle={onToggle}
          onOpen={onOpen}
        />
      )}

      {nothingOpen ? (
        <div className="today-view__empty">
          <p className="today-view__empty-title">
            {tasks.length === 0 ? 'Noch keine Aufgaben.' : 'Alles erledigt für heute.'}
          </p>
          <p className="today-view__empty-text">Neue Aufgaben fügst du mit dem Plus-Button hinzu.</p>
        </div>
      ) : (
        <TaskSection title="Heute" tasks={openToday} todayKey={todayKey} onToggle={onToggle} onOpen={onOpen} />
      )}

      {doneToday.length > 0 && (
        <TaskSection
          title="Erledigt"
          tone="success"
          tasks={showDone ? doneToday : []}
          count={doneToday.length}
          todayKey={todayKey}
          onToggle={onToggle}
          onOpen={onOpen}
          action={
            <button type="button" className="today-view__toggle" onClick={() => setShowDone(!showDone)}>
              {showDone ? 'Ausblenden' : 'Anzeigen'}
            </button>
          }
        />
      )}
    </div>
  )
}

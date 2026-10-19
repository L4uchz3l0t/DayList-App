import { DayProgress } from '../components/DayProgress'
import { DoneSection } from '../components/DoneSection'
import { EmptyState } from '../components/EmptyState'
import { TaskSection } from '../components/TaskSection'
import { byPriority, getOverdueTasks } from '../tasks/taskViews'
import type { Task } from '../tasks/types'

interface TodayViewProps {
  tasks: Task[]
  todayKey: string
  onToggle: (id: string) => void
  onOpen: (id: string) => void
  onMove: (id: string) => void
  onAdd: () => void
}

export function TodayView({ tasks, todayKey, onToggle, onOpen, onMove, onAdd }: TodayViewProps) {
  const overdue = getOverdueTasks(tasks, todayKey)
  const plannedToday = tasks.filter((t) => t.plannedDate === todayKey)
  const openToday = plannedToday.filter((t) => t.status === 'open').sort(byPriority)
  const doneToday = plannedToday.filter((t) => t.status === 'done')

  const nothingOpen = overdue.length === 0 && openToday.length === 0

  return (
    <div>
      <DayProgress done={doneToday.length} total={plannedToday.length} />

      {overdue.length > 0 && (
        <TaskSection
          title="Überfällig"
          tone="danger"
          tasks={overdue}
          todayKey={todayKey}
          onToggle={onToggle}
          onOpen={onOpen}
          onMove={onMove}
          collapsible={{ storageKey: 'today-overdue' }}
        />
      )}

      {nothingOpen ? (
        <EmptyState
          title={tasks.length === 0 ? 'Noch keine Aufgaben.' : 'Alles erledigt für heute.'}
          text="Tippe hier, um eine neue Aufgabe hinzuzufügen."
          onClick={onAdd}
        />
      ) : (
        <TaskSection
          title="Heute"
          tasks={openToday}
          todayKey={todayKey}
          onToggle={onToggle}
          onOpen={onOpen}
          onMove={onMove}
          collapsible={{ storageKey: 'today-open' }}
        />
      )}

      <DoneSection storageKey="today-done" tasks={doneToday} todayKey={todayKey} onToggle={onToggle} onOpen={onOpen} />
    </div>
  )
}

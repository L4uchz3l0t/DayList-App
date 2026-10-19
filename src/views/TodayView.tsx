import { DayProgress } from '../components/DayProgress'
import { DoneSection } from '../components/DoneSection'
import { EmptyState } from '../components/EmptyState'
import { TaskSection } from '../components/TaskSection'
import { byPriority, getOverdueTasks } from '../tasks/taskViews'
import type { Task } from '../tasks/types'
import { useI18n } from '../i18n/useI18n'

interface TodayViewProps {
  tasks: Task[]
  todayKey: string
  onToggle: (id: string) => void
  onOpen: (id: string) => void
  onMove: (id: string) => void
  onAdd: () => void
}

export function TodayView({ tasks, todayKey, onToggle, onOpen, onMove, onAdd }: TodayViewProps) {
  const { t } = useI18n()
  const overdue = getOverdueTasks(tasks, todayKey)
  const plannedToday = tasks.filter((task) => task.plannedDate === todayKey)
  const openToday = plannedToday.filter((task) => task.status === 'open').sort(byPriority)
  const doneToday = plannedToday.filter((task) => task.status === 'done')

  const nothingOpen = overdue.length === 0 && openToday.length === 0

  return (
    <div>
      <DayProgress done={doneToday.length} total={plannedToday.length} />

      {overdue.length > 0 && (
        <TaskSection
          title={t.sections.overdue}
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
          title={tasks.length === 0 ? t.empty.noTasks : t.empty.allDone}
          text={t.empty.tapToAdd}
          onClick={onAdd}
        />
      ) : (
        <TaskSection
          title={t.sections.today}
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

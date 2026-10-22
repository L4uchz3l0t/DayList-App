import { DayProgress } from '../components/DayProgress'
import { DoneSection } from '../components/DoneSection'
import { EmptyState } from '../components/EmptyState'
import { TaskSection } from '../components/TaskSection'
import { byEventTime, byTimeAndPriority, getOverdueTasks, isEvent } from '../tasks/taskViews'
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

/** Heute: oben die Aufgaben, darunter die Termine (nach Uhrzeit), dann Überfälliges und Erledigtes. */
export function TodayView({ tasks, todayKey, onToggle, onOpen, onMove, onAdd }: TodayViewProps) {
  const { t } = useI18n()
  const overdue = getOverdueTasks(tasks, todayKey)
  const onToday = tasks.filter((task) => task.plannedDate === todayKey)
  const events = onToday.filter(isEvent).sort(byEventTime)
  const plannedToday = onToday.filter((task) => !isEvent(task))
  const openToday = plannedToday.filter((task) => task.status === 'open').sort(byTimeAndPriority)
  const doneToday = plannedToday.filter((task) => task.status === 'done')

  return (
    <div>
      <DayProgress done={doneToday.length} total={plannedToday.length} />

      <TaskSection
        title={t.sections.tasks}
        tasks={openToday}
        todayKey={todayKey}
        onToggle={onToggle}
        onOpen={onOpen}
        onMove={onMove}
        collapsible={{ storageKey: 'today-open' }}
      >
        {openToday.length === 0 && (
          <EmptyState
            title={tasks.length === 0 ? t.empty.noTasks : t.empty.allDone}
            text={t.empty.tapToAdd}
            onClick={onAdd}
            compact
          />
        )}
      </TaskSection>

      {events.length > 0 && (
        <TaskSection
          title={t.sections.events}
          tone="event"
          tasks={events}
          todayKey={todayKey}
          onToggle={onToggle}
          onOpen={onOpen}
          onMove={onMove}
          collapsible={{ storageKey: 'today-events' }}
        />
      )}

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

      <DoneSection storageKey="today-done" tasks={doneToday} todayKey={todayKey} onToggle={onToggle} onOpen={onOpen} />
    </div>
  )
}

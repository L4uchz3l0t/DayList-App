import { DoneSection } from '../components/DoneSection'
import { EmptyState } from '../components/EmptyState'
import { TaskSection } from '../components/TaskSection'
import { getInboxTasks } from '../tasks/taskViews'
import type { Task } from '../tasks/types'
import './views.css'
import { useI18n } from '../i18n/useI18n'

interface InboxViewProps {
  tasks: Task[]
  todayKey: string
  onToggle: (id: string) => void
  onOpen: (id: string) => void
  onMove: (id: string) => void
  onAdd: () => void
}

/** Irgendwann: alles, was noch keinem Tag zugeordnet ist (im Code "inbox"). */
export function InboxView({ tasks, todayKey, onToggle, onOpen, onMove, onAdd }: InboxViewProps) {
  const { t } = useI18n()
  const inbox = getInboxTasks(tasks)

  return (
    <div>
      <p className="view-intro">{t.someday.intro}</p>

      {inbox.open.length === 0 ? (
        <EmptyState
          title={t.empty.somedayEmpty}
          text={t.empty.somedayTap}
          onClick={onAdd}
        />
      ) : (
        <TaskSection
          title={t.sections.noDay}
          tasks={inbox.open}
          todayKey={todayKey}
          onToggle={onToggle}
          onOpen={onOpen}
          onMove={onMove}
        />
      )}

      <DoneSection storageKey="someday-done" tasks={inbox.done} todayKey={todayKey} onToggle={onToggle} onOpen={onOpen} />
    </div>
  )
}

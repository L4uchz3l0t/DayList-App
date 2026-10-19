import { DoneSection } from '../components/DoneSection'
import { EmptyState } from '../components/EmptyState'
import { TaskSection } from '../components/TaskSection'
import { getInboxTasks } from '../tasks/taskViews'
import type { Task } from '../tasks/types'
import './views.css'

interface InboxViewProps {
  tasks: Task[]
  todayKey: string
  onToggle: (id: string) => void
  onOpen: (id: string) => void
  onMove: (id: string) => void
  onAdd: () => void
}

/** Eingang: alles, was noch keinem Tag zugeordnet ist. */
export function InboxView({ tasks, todayKey, onToggle, onOpen, onMove, onAdd }: InboxViewProps) {
  const inbox = getInboxTasks(tasks)

  return (
    <div>
      <p className="view-intro">Hier sammelt sich alles ohne festen Tag. Tippe auf den Kalender, um es einzuplanen.</p>

      {inbox.open.length === 0 ? (
        <EmptyState
          title="Der Eingang ist leer."
          text="Tippe hier, um schnell etwas zu notieren."
          onClick={onAdd}
        />
      ) : (
        <TaskSection
          title="Ohne Tag"
          tasks={inbox.open}
          todayKey={todayKey}
          onToggle={onToggle}
          onOpen={onOpen}
          onMove={onMove}
        />
      )}

      <DoneSection tasks={inbox.done} todayKey={todayKey} onToggle={onToggle} onOpen={onOpen} />
    </div>
  )
}

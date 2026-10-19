import { useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { TaskSection } from '../components/TaskSection'
import { getInboxTasks, getOverdueTasks, getUpcomingTasks, searchTasks } from '../tasks/taskViews'
import type { Task } from '../tasks/types'
import './views.css'

interface AllViewProps {
  tasks: Task[]
  todayKey: string
  onToggle: (id: string) => void
  onOpen: (id: string) => void
  onMove: (id: string) => void
  onAdd: () => void
}

/** Alle Aufgaben durchsuchen: überfällig, geplant, im Eingang und auf Wunsch erledigt. */
export function AllView({ tasks, todayKey, onToggle, onOpen, onMove, onAdd }: AllViewProps) {
  const [query, setQuery] = useState('')
  const [showDone, setShowDone] = useState(false)

  if (tasks.length === 0) {
    return (
      <EmptyState title="Noch keine Aufgaben." text="Tippe hier, um eine neue Aufgabe hinzuzufügen." onClick={onAdd} />
    )
  }

  const found = searchTasks(tasks, query)
  const overdue = getOverdueTasks(found, todayKey)
  const upcoming = getUpcomingTasks(found, todayKey)
  const inbox = getInboxTasks(found).open
  // Zuletzt erledigte zuerst
  const done = found
    .filter((task) => task.status === 'done')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const visibleCount = overdue.length + upcoming.length + inbox.length + (showDone ? done.length : 0)

  const sectionProps = { todayKey, onToggle, onOpen, onMove }

  return (
    <div>
      <div className="all-view__tools">
        <label className="all-view__search">
          <Icon name="search" size={18} />
          <input
            className="field"
            type="search"
            placeholder="Aufgaben durchsuchen …"
            aria-label="Aufgaben durchsuchen"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="chip all-view__done-toggle"
          aria-pressed={showDone}
          onClick={() => setShowDone(!showDone)}
        >
          Erledigte zeigen
        </button>
      </div>

      {visibleCount === 0 && (
        <EmptyState
          title={query.trim() ? `Nichts gefunden für „${query.trim()}“.` : 'Keine offenen Aufgaben.'}
          text={!showDone && done.length > 0 ? `${done.length} erledigte Aufgaben sind ausgeblendet.` : undefined}
        />
      )}
      {overdue.length > 0 && <TaskSection title="Überfällig" tone="danger" tasks={overdue} {...sectionProps} />}
      {upcoming.length > 0 && <TaskSection title="Geplant" tasks={upcoming} showPlannedDate {...sectionProps} />}
      {inbox.length > 0 && <TaskSection title="Eingang" tasks={inbox} {...sectionProps} />}
      {showDone && done.length > 0 && (
        <TaskSection title="Erledigt" tone="success" tasks={done} showPlannedDate {...sectionProps} />
      )}
    </div>
  )
}

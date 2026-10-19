import { useState } from 'react'
import type { Task } from '../tasks/types'
import { TaskSection } from './TaskSection'

interface DoneSectionProps {
  tasks: Task[]
  todayKey: string
  onToggle: (id: string) => void
  onOpen: (id: string) => void
}

/** Erledigte Aufgaben, standardmäßig eingeklappt, damit die Liste übersichtlich bleibt. */
export function DoneSection({ tasks, todayKey, onToggle, onOpen }: DoneSectionProps) {
  const [isOpen, setOpen] = useState(false)
  if (tasks.length === 0) return null

  return (
    <TaskSection
      title="Erledigt"
      tone="success"
      tasks={isOpen ? tasks : []}
      count={tasks.length}
      todayKey={todayKey}
      onToggle={onToggle}
      onOpen={onOpen}
      action={
        <button type="button" className="task-section__toggle" onClick={() => setOpen(!isOpen)}>
          {isOpen ? 'Ausblenden' : 'Anzeigen'}
        </button>
      }
    />
  )
}

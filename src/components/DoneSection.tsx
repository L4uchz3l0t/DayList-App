import type { Task } from '../tasks/types'
import { TaskSection } from './TaskSection'
import { useI18n } from '../i18n/useI18n'

interface DoneSectionProps {
  tasks: Task[]
  todayKey: string
  onToggle: (id: string) => void
  onOpen: (id: string) => void
  /** Unter diesem Namen wird gemerkt, ob der Bereich aufgeklappt ist */
  storageKey: string
}

/** Erledigte Aufgaben, standardmäßig eingeklappt, damit die Liste übersichtlich bleibt. */
export function DoneSection({ tasks, todayKey, onToggle, onOpen, storageKey }: DoneSectionProps) {
  const { t } = useI18n()
  if (tasks.length === 0) return null

  return (
    <TaskSection
      title={t.sections.done}
      tone="success"
      tasks={tasks}
      todayKey={todayKey}
      onToggle={onToggle}
      onOpen={onOpen}
      collapsible={{ storageKey, defaultCollapsed: true }}
    />
  )
}

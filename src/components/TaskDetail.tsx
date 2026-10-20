import { useState, type FormEvent } from 'react'
import type { TaskChanges } from '../tasks/taskOperations'
import type { Task } from '../tasks/types'
import { Sheet } from './Sheet'
import { DayPicker, DueDateField, ImportantToggle, TimeField } from './TaskFields'
import './TaskDetail.css'
import { useI18n } from '../i18n/useI18n'

interface TaskDetailProps {
  task: Task
  todayKey: string
  onSave: (changes: TaskChanges) => void
  onToggle: () => void
  onDelete: () => void
  onClose: () => void
  /** Das Fenster blendet gerade aus */
  closing?: boolean
}

/**
 * Detailansicht einer Aufgabe: Titel, Tag, Uhrzeit mit Erinnerung, Frist und Wichtigkeit ändern, erledigen oder löschen.
 * Änderungen werden erst mit "Speichern" übernommen. Schließen verwirft sie.
 */
export function TaskDetail({ task, todayKey, onSave, onToggle, onDelete, onClose, closing }: TaskDetailProps) {
  const { t } = useI18n()
  const [title, setTitle] = useState(task.title)
  const [plannedDate, setPlannedDate] = useState(task.plannedDate ?? '')
  const [dueDate, setDueDate] = useState(task.dueDate ?? '')
  const [isImportant, setImportant] = useState(task.priority === 'high')
  const [time, setTime] = useState(task.time ?? '')
  const [reminder, setReminder] = useState(task.reminder)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isDone = task.status === 'done'

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (title.trim() === '') return
    onSave({
      title,
      plannedDate: plannedDate || undefined,
      dueDate: dueDate || undefined,
      priority: isImportant ? 'high' : undefined,
      time: time || undefined,
      reminder: time ? reminder : undefined,
    })
  }

  return (
    <Sheet title={t.detail.title} onClose={onClose} closing={closing}>
      <form className="task-detail" onSubmit={handleSubmit}>
        <label className="task-field">
          <span className="task-field__label">{t.detail.titleField}</span>
          <input className="field" type="text" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>

        <DayPicker value={plannedDate} onChange={setPlannedDate} todayKey={todayKey} showDateInput />
        {plannedDate && (
          <TimeField time={time} reminder={reminder} onTimeChange={setTime} onReminderChange={setReminder} />
        )}
        <DueDateField value={dueDate} onChange={setDueDate} todayKey={todayKey} />
        <ImportantToggle value={isImportant} onChange={setImportant} />

        <div className="task-detail__actions">
          <button type="submit" className="button button--primary" disabled={title.trim() === ''}>
            {t.common.save}
          </button>
          <button type="button" className="button button--secondary" onClick={onToggle}>
            {isDone ? t.detail.reopen : t.detail.done}
          </button>
          <button
            type="button"
            className={`button ${confirmDelete ? 'button--danger-strong' : 'button--danger'} task-detail__delete`}
            onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
          >
            {confirmDelete ? t.detail.confirmDelete : t.detail.delete}
          </button>
        </div>
      </form>
    </Sheet>
  )
}

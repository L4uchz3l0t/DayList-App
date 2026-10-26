import { useState, type FormEvent } from 'react'
import type { TaskChanges } from '../tasks/taskOperations'
import type { Task, TaskKind } from '../tasks/types'
import { Sheet } from './Sheet'
import { DayPicker, DueDateField, KindPicker, TimeField } from './TaskFields'
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
 * Detailansicht einer Aufgabe oder eines Termins: Art, Titel, Tag, Uhrzeit mit Erinnerung und Frist ändern,
 * erledigen (nur Aufgaben) oder löschen.
 * Änderungen werden erst mit "Speichern" übernommen. Schließen verwirft sie.
 */
export function TaskDetail({ task, todayKey, onSave, onToggle, onDelete, onClose, closing }: TaskDetailProps) {
  const { t } = useI18n()
  const [title, setTitle] = useState(task.title)
  const [plannedDate, setPlannedDate] = useState(task.plannedDate ?? '')
  const [dueDate, setDueDate] = useState(task.dueDate ?? '')
  const [kind, setKind] = useState<TaskKind>(task.kind ?? 'task')
  const [time, setTime] = useState(task.time ?? '')
  const [reminder, setReminder] = useState(task.reminder)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isDone = task.status === 'done'
  const isEvent = kind === 'event'

  function changeKind(next: TaskKind) {
    setKind(next)
    if (next === 'event' && plannedDate === '') setPlannedDate(todayKey)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (title.trim() === '') return
    onSave({
      title,
      kind: isEvent ? 'event' : undefined,
      // Termine werden nicht abgehakt: wird eine erledigte Aufgabe zum Termin, ist sie wieder offen
      ...(isEvent && isDone ? { status: 'open' as const } : {}),
      plannedDate: plannedDate || undefined,
      dueDate: dueDate && !isEvent ? dueDate : undefined,
      // "Wichtig" gibt es nicht mehr
      priority: undefined,
      time: time || undefined,
      reminder: time ? reminder : undefined,
    })
  }

  return (
    <Sheet title={isEvent ? t.detail.titleEvent : t.detail.title} onClose={onClose} closing={closing}>
      <form className="task-detail" onSubmit={handleSubmit}>
        <KindPicker value={kind} onChange={changeKind} />
        <label className="task-field">
          <span className="task-field__label">{t.detail.titleField}</span>
          <input className="field" type="text" maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>

        <DayPicker
          value={plannedDate}
          onChange={setPlannedDate}
          todayKey={todayKey}
          showDateInput
          allowSomeday={!isEvent}
          label={isEvent ? t.fields.eventDay : undefined}
        />
        {plannedDate && (
          <TimeField time={time} reminder={reminder} onTimeChange={setTime} onReminderChange={setReminder} />
        )}
        {!isEvent && <DueDateField value={dueDate} onChange={setDueDate} todayKey={todayKey} />}

        <div className="task-detail__actions">
          <button type="submit" className="button button--primary" disabled={title.trim() === ''}>
            {t.common.save}
          </button>
          {!isEvent && (
            <button type="button" className="button button--secondary" onClick={onToggle}>
              {isDone ? t.detail.reopen : t.detail.done}
            </button>
          )}
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

import { useState, type FormEvent } from 'react'
import { addDays, parseDateKey, toDateKey } from '../tasks/dates'
import type { TaskChanges } from '../tasks/taskOperations'
import type { Task } from '../tasks/types'
import { Icon } from './Icon'
import { Sheet } from './Sheet'
import './TaskDetail.css'

interface TaskDetailProps {
  task: Task
  todayKey: string
  onSave: (changes: TaskChanges) => void
  onToggle: () => void
  onDelete: () => void
  onClose: () => void
}

/**
 * Detailansicht einer Aufgabe: Titel, Tag, Frist und Wichtigkeit ändern, erledigen oder löschen.
 * Änderungen werden erst mit "Speichern" übernommen. Schließen verwirft sie.
 */
export function TaskDetail({ task, todayKey, onSave, onToggle, onDelete, onClose }: TaskDetailProps) {
  const [title, setTitle] = useState(task.title)
  const [plannedDate, setPlannedDate] = useState(task.plannedDate ?? '')
  const [dueDate, setDueDate] = useState(task.dueDate ?? '')
  const [isImportant, setImportant] = useState(task.priority === 'high')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const tomorrowKey = toDateKey(addDays(parseDateKey(todayKey), 1))
  const isDone = task.status === 'done'

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (title.trim() === '') return
    onSave({
      title,
      plannedDate: plannedDate || undefined,
      dueDate: dueDate || undefined,
      priority: isImportant ? 'high' : undefined,
    })
  }

  const dayOptions = [
    { label: 'Eingang', value: '' },
    { label: 'Heute', value: todayKey },
    { label: 'Morgen', value: tomorrowKey },
  ]

  return (
    <Sheet title="Aufgabe bearbeiten" onClose={onClose}>
      <form className="task-detail" onSubmit={handleSubmit}>
        <label className="task-detail__group">
          <span className="task-detail__label">Titel</span>
          <input className="field" type="text" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>

        <div className="task-detail__group">
          <span className="task-detail__label" id="planned-label">
            Geplant für
          </span>
          <div className="chips" role="radiogroup" aria-labelledby="planned-label">
            {dayOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                role="radio"
                aria-checked={plannedDate === option.value}
                className="chip"
                onClick={() => setPlannedDate(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <input
            className="field task-detail__date"
            type="date"
            aria-label="Anderer Tag"
            value={plannedDate}
            onChange={(event) => setPlannedDate(event.target.value)}
          />
        </div>

        <div className="task-detail__group">
          <span className="task-detail__label">Frist (verbindlich, optional)</span>
          <div className="task-detail__row">
            <input
              className="field task-detail__date"
              type="date"
              aria-label="Frist"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
            {dueDate && (
              <button type="button" className="button button--secondary" onClick={() => setDueDate('')}>
                Keine Frist
              </button>
            )}
          </div>
        </div>

        <div className="task-detail__group">
          <button
            type="button"
            className="chip task-detail__important"
            aria-pressed={isImportant}
            onClick={() => setImportant(!isImportant)}
          >
            <Icon name="flag" size={14} /> Wichtig
          </button>
        </div>

        <div className="task-detail__actions">
          <button type="submit" className="button button--primary" disabled={title.trim() === ''}>
            Speichern
          </button>
          <button type="button" className="button button--secondary" onClick={onToggle}>
            {isDone ? 'Wieder öffnen' : 'Erledigt'}
          </button>
          <button
            type="button"
            className={`button ${confirmDelete ? 'button--danger-strong' : 'button--danger'} task-detail__delete`}
            onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
          >
            {confirmDelete ? 'Wirklich löschen?' : 'Löschen'}
          </button>
        </div>
      </form>
    </Sheet>
  )
}

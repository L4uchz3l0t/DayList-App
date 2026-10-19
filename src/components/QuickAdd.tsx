import { useEffect, useRef, useState, type FormEvent } from 'react'
import { addDays, formatShortDate, parseDateKey, toDateKey } from '../tasks/dates'
import type { NewTaskInput } from '../tasks/taskOperations'
import { Icon } from './Icon'
import { Sheet } from './Sheet'
import { DayPicker, DueDateField, ImportantToggle } from './TaskFields'
import './QuickAdd.css'

interface QuickAddProps {
  todayKey: string
  onSave: (input: NewTaskInput) => void
  onClose: () => void
}

/**
 * Schnellaufnahme: Titel tippen, Enter drücken, fertig.
 * Ohne Auswahl landet die Aufgabe im Eingang. Danach ist das Feld sofort wieder bereit.
 * Unter "Mehr Optionen" gibt es dieselben Angaben wie in der Detailansicht.
 */
export function QuickAdd({ todayKey, onSave, onClose }: QuickAddProps) {
  const [title, setTitle] = useState('')
  const [plannedDate, setPlannedDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [isImportant, setImportant] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function describeDay(dateKey: string): string {
    if (dateKey === '') return 'Eingang'
    if (dateKey === todayKey) return 'Heute'
    if (dateKey === toDateKey(addDays(parseDateKey(todayKey), 1))) return 'Morgen'
    return formatShortDate(dateKey)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = title.trim()
    if (trimmed === '') return
    onSave({
      title: trimmed,
      plannedDate: plannedDate || undefined,
      dueDate: dueDate || undefined,
      priority: isImportant ? 'high' : undefined,
    })
    setSavedMessage(`✓ „${trimmed}“ gespeichert (${describeDay(plannedDate)})`)
    // Titel, Frist und Wichtig gelten nur für diese Aufgabe, der Tag bleibt für die nächste stehen
    setTitle('')
    setDueDate('')
    setImportant(false)
    inputRef.current?.focus()
  }

  return (
    <Sheet title="Neue Aufgabe" onClose={onClose}>
      <form className="quick-add" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="field"
          type="text"
          placeholder="Was möchtest du nicht vergessen?"
          aria-label="Titel der Aufgabe"
          enterKeyHint="done"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value)
            setSavedMessage(null)
          }}
        />

        <DayPicker value={plannedDate} onChange={setPlannedDate} todayKey={todayKey} showDateInput={showMore} />

        <button
          type="button"
          className="quick-add__more"
          aria-expanded={showMore}
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? 'Weniger Optionen' : 'Mehr Optionen'}
          <Icon name="chevronDown" size={18} />
        </button>

        {showMore && (
          <div className="quick-add__extra">
            <DueDateField value={dueDate} onChange={setDueDate} />
            <ImportantToggle value={isImportant} onChange={setImportant} />
          </div>
        )}

        <div className="quick-add__footer">
          <p className="quick-add__status" role="status">
            {savedMessage ?? ''}
          </p>
          <button type="submit" className="button button--primary" disabled={title.trim() === ''}>
            Speichern
          </button>
        </div>
      </form>
    </Sheet>
  )
}

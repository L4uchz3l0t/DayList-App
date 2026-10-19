import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { NewTaskInput } from '../tasks/taskOperations'
import { describePlannedDay, getDayKind } from '../tasks/taskViews'
import { Icon } from './Icon'
import { Sheet } from './Sheet'
import { DayPicker, DueDateField, ImportantToggle } from './TaskFields'
import './QuickAdd.css'
import { useI18n } from '../i18n/useI18n'

interface QuickAddProps {
  todayKey: string
  /** Vorgewählter Tag ('' = Irgendwann), zum Beispiel wenn die Schnellaufnahme aus der Woche geöffnet wird */
  initialPlannedDate?: string
  onSave: (input: NewTaskInput) => void
  onClose: () => void
}

/**
 * Schnellaufnahme: Titel tippen, Enter drücken, fertig.
 * Ohne Auswahl landet die Aufgabe unter Irgendwann. Danach ist das Feld sofort wieder bereit.
 * Unter "Mehr Optionen" gibt es dieselben Angaben wie in der Detailansicht.
 */
export function QuickAdd({ todayKey, initialPlannedDate = '', onSave, onClose }: QuickAddProps) {
  const { t } = useI18n()
  const [title, setTitle] = useState('')
  const [plannedDate, setPlannedDate] = useState(initialPlannedDate)
  const [dueDate, setDueDate] = useState('')
  const [isImportant, setImportant] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Ein anderer Tag als Heute/Morgen muss sichtbar sein, auch wenn die Optionen zugeklappt sind
  const dayLabel = describePlannedDay(plannedDate || undefined, todayKey, t.days, t.locale)
  const isOtherDay = getDayKind(plannedDate || undefined, todayKey) === 'other'

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
    setSavedMessage(t.quickAdd.saved(trimmed, dayLabel))
    // Titel, Frist und Wichtig gelten nur für diese Aufgabe, der Tag bleibt für die nächste stehen
    setTitle('')
    setDueDate('')
    setImportant(false)
    inputRef.current?.focus()
  }

  return (
    <Sheet title={t.quickAdd.title} onClose={onClose}>
      <form className="quick-add" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="field"
          type="text"
          placeholder={t.quickAdd.placeholder}
          aria-label={t.quickAdd.inputLabel}
          enterKeyHint="done"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value)
            setSavedMessage(null)
          }}
        />

        <DayPicker value={plannedDate} onChange={setPlannedDate} todayKey={todayKey} showDateInput={showMore || isOtherDay} />

        <button
          type="button"
          className="quick-add__more"
          aria-expanded={showMore}
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? t.quickAdd.less : t.quickAdd.more}
          <Icon name="chevronDown" size={18} />
        </button>

        {showMore && (
          <div className="quick-add__extra">
            <DueDateField value={dueDate} onChange={setDueDate} todayKey={todayKey} />
            <ImportantToggle value={isImportant} onChange={setImportant} />
          </div>
        )}

        <div className="quick-add__footer">
          <p className="quick-add__status" role="status">
            {savedMessage ?? ''}
          </p>
          <button type="submit" className="button button--primary" disabled={title.trim() === ''}>
            {t.common.save}
          </button>
        </div>
      </form>
    </Sheet>
  )
}

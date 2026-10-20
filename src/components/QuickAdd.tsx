import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { NewTaskInput } from '../tasks/taskOperations'
import { describePlannedDay, getDayKind } from '../tasks/taskViews'
import { Icon } from './Icon'
import { Sheet } from './Sheet'
import { DayPicker, DueDateField, ImportantToggle, TimeField } from './TaskFields'
import './QuickAdd.css'
import { useI18n } from '../i18n/useI18n'

interface QuickAddProps {
  todayKey: string
  /** Vorgewählter Tag ('' = Irgendwann), zum Beispiel wenn die Schnellaufnahme aus der Woche geöffnet wird */
  initialPlannedDate?: string
  onSave: (input: NewTaskInput) => void
  onClose: () => void
  /**
   * true: nach dem Speichern schließt sich das Fenster ganz und `onSaved` meldet die Aufgabe.
   * false: das Fenster klappt zum unteren Rand ein und bleibt für die nächste Aufgabe bereit.
   */
  closeAfterSave?: boolean
  /** Rückmeldung nach dem Speichern, wenn sich das Fenster schließt */
  onSaved?: (message: string) => void
  /** Das Fenster blendet gerade aus */
  closing?: boolean
}

/**
 * Schnellaufnahme: Titel tippen, Enter drücken, fertig.
 * Ohne Auswahl landet die Aufgabe unter Irgendwann.
 * Nach dem Speichern schließt sie sich (unter Heute) oder klappt zum unteren Rand ein,
 * sodass Textfeld und Tag sichtbar bleiben. Ein Tipp ins Textfeld klappt sie wieder aus.
 * Unter "Mehr Optionen" gibt es dieselben Angaben wie in der Detailansicht.
 */
export function QuickAdd({
  todayKey,
  initialPlannedDate = '',
  onSave,
  onClose,
  closeAfterSave = false,
  onSaved,
  closing,
}: QuickAddProps) {
  const { t } = useI18n()
  const [title, setTitle] = useState('')
  const [plannedDate, setPlannedDate] = useState(initialPlannedDate)
  const [dueDate, setDueDate] = useState('')
  const [isImportant, setImportant] = useState(false)
  const [time, setTime] = useState('')
  const [reminder, setReminder] = useState<number | undefined>(undefined)
  const [showMore, setShowMore] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [minimized, setMinimized] = useState(false)
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
      time: plannedDate && time ? time : undefined,
      reminder: plannedDate && time ? reminder : undefined,
    })
    const message = t.quickAdd.saved(trimmed, dayLabel)
    if (closeAfterSave) {
      onSaved?.(message)
      onClose()
      return
    }
    setSavedMessage(message)
    // Titel, Uhrzeit, Frist und Wichtig gelten nur für diese Aufgabe, der Tag bleibt für die nächste stehen
    setTitle('')
    setDueDate('')
    setImportant(false)
    setTime('')
    setReminder(undefined)
    setShowMore(false)
    // Einklappen und Tastatur schließen, damit die Liste dahinter wieder sichtbar ist
    setMinimized(true)
    inputRef.current?.blur()
  }

  return (
    <Sheet title={t.quickAdd.title} onClose={onClose} closing={closing} minimized={minimized}>
      <form className="quick-add" onSubmit={handleSubmit}>
        {minimized && savedMessage && (
          <p className="quick-add__status" role="status">
            {savedMessage}
          </p>
        )}
        <input
          ref={inputRef}
          className="field"
          type="text"
          placeholder={t.quickAdd.placeholder}
          aria-label={t.quickAdd.inputLabel}
          enterKeyHint="done"
          value={title}
          onFocus={() => setMinimized(false)}
          onChange={(event) => {
            setTitle(event.target.value)
            setSavedMessage(null)
          }}
        />

        <DayPicker value={plannedDate} onChange={setPlannedDate} todayKey={todayKey} showDateInput={showMore || isOtherDay} />

        {/* Ausgeklappter Teil: verschwindet weich, wenn das Fenster zum unteren Rand einklappt */}
        <div className="quick-add__expandable" data-collapsed={minimized} inert={minimized}>
          <div className="quick-add__expandable-inner">
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
                {plannedDate && (
                  <TimeField time={time} reminder={reminder} onTimeChange={setTime} onReminderChange={setReminder} />
                )}
                <DueDateField value={dueDate} onChange={setDueDate} todayKey={todayKey} />
                <ImportantToggle value={isImportant} onChange={setImportant} />
              </div>
            )}

            <div className="quick-add__footer">
              <p className="quick-add__status" role="status">
                {minimized ? '' : (savedMessage ?? '')}
              </p>
              <button type="submit" className="button button--primary" disabled={title.trim() === ''}>
                {t.common.save}
              </button>
            </div>
          </div>
        </div>
      </form>
    </Sheet>
  )
}

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { classify } from '../ai/assistant'
import { readAutoDetect } from '../ai/autoDetect'
import type { NewTaskInput } from '../tasks/taskOperations'
import type { TaskKind, TaskRepeat } from '../tasks/types'
import { describePlannedDay, getDayKind } from '../tasks/taskViews'
import { Icon } from './Icon'
import { Sheet } from './Sheet'
import { DayPicker, DueDateField, KindPicker, RepeatField, TimeField } from './TaskFields'
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
 * Oben wählt ein kleiner Marker, ob es eine Aufgabe oder ein Termin ist. Termine brauchen einen Tag.
 * Ohne Auswahl landet die Aufgabe unter Irgendwann.
 * Nach dem Speichern schließt sie sich (unter Heute) oder klappt zum unteren Rand ein,
 * sodass Textfeld und Tag sichtbar bleiben. Ein Tipp ins Textfeld klappt sie wieder aus.
 * Unter "Mehr Optionen" gibt es dieselben Angaben wie in der Detailansicht.
 * Beim Tippen erkennt die KI, ob es ein Termin ist, und liest Tag und Uhrzeit aus dem Text
 * ("Zahnarzt morgen 14:30"). Was du selbst auswählst, hat immer Vorrang.
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
  const [chosenDate, setChosenDate] = useState(initialPlannedDate)
  const [dueDate, setDueDate] = useState('')
  // Selbst gewählt (null = noch nicht angefasst, dann entscheidet die Erkennung)
  const [chosenKind, setChosenKind] = useState<TaskKind | null>(null)
  const [dayChosen, setDayChosen] = useState(false)
  const [chosenTime, setChosenTime] = useState<string | null>(null)
  const [autoDetect] = useState(readAutoDetect)
  const [reminder, setReminder] = useState<number | undefined>(undefined)
  const [repeat, setRepeat] = useState<TaskRepeat | undefined>(undefined)
  const [showMore, setShowMore] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [minimized, setMinimized] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const detected = useMemo(
    () => (autoDetect && title.trim() !== '' ? classify(title, todayKey) : null),
    [autoDetect, title, todayKey],
  )
  const kind: TaskKind = chosenKind ?? detected?.kind ?? 'task'
  const dateFromText = !dayChosen && detected?.date ? detected.date : undefined
  const timeFromText = chosenTime === null && detected?.time ? detected.time : undefined
  // Ein Termin ohne Tag ergibt keinen Sinn: dann heute
  const plannedDate = dateFromText ?? (kind === 'event' && chosenDate === '' ? todayKey : chosenDate)
  const time = timeFromText ?? chosenTime ?? ''

  function setPlannedDate(value: string) {
    setChosenDate(value)
    setDayChosen(true)
  }

  // Ein anderer Tag als Heute/Morgen muss sichtbar sein, auch wenn die Optionen zugeklappt sind
  const dayLabel = describePlannedDay(plannedDate || undefined, todayKey, t.days, t.locale)
  const isOtherDay = getDayKind(plannedDate || undefined, todayKey) === 'other'
  const isEvent = kind === 'event'

  function changeKind(next: TaskKind) {
    setChosenKind(next)
  }

  // Tag und Uhrzeit aus dem Text übernommen: dann ohne diese Angaben speichern ("Zahnarzt" statt "Zahnarzt morgen 14:30")
  const usedText = detected !== null && (dateFromText !== undefined || timeFromText !== undefined)
  const detectedHint =
    usedText || (detected?.kind === 'event' && chosenKind === null)
      ? t.ai.detected(
          kind === 'event' ? t.fields.kindEvent : t.fields.kindTask,
          dateFromText ? dayLabel : undefined,
          timeFromText,
        )
      : null

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = usedText && detected ? detected.title : title.trim()
    if (trimmed === '') return
    onSave({
      title: trimmed,
      kind: isEvent ? 'event' : undefined,
      plannedDate: plannedDate || undefined,
      dueDate: dueDate && !isEvent ? dueDate : undefined,
      time: plannedDate && time ? time : undefined,
      reminder: plannedDate && time ? reminder : undefined,
      repeat: plannedDate ? repeat : undefined,
    })
    const message = t.quickAdd.saved(trimmed, dayLabel)
    if (closeAfterSave) {
      onSaved?.(message)
      onClose()
      return
    }
    setSavedMessage(message)
    // Titel, Uhrzeit und Frist gelten nur für diesen Eintrag, Tag und Marker bleiben für den nächsten stehen
    setTitle('')
    setDueDate('')
    setChosenTime(null)
    setReminder(undefined)
    setRepeat(undefined)
    setShowMore(false)
    // Einklappen und Tastatur schließen, damit die Liste dahinter wieder sichtbar ist
    setMinimized(true)
    inputRef.current?.blur()
  }

  return (
    <Sheet title={isEvent ? t.quickAdd.titleEvent : t.quickAdd.title} onClose={onClose} closing={closing} minimized={minimized}>
      <form className="quick-add" onSubmit={handleSubmit}>
        {minimized && savedMessage && (
          <p className="quick-add__status" role="status">
            {savedMessage}
          </p>
        )}
        {!minimized && <KindPicker value={kind} onChange={changeKind} />}
        <input
          ref={inputRef}
          className="field"
          type="text"
          maxLength={200}
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

        {detectedHint && !minimized && <p className="quick-add__detected">{detectedHint}</p>}

        <DayPicker
          value={plannedDate}
          onChange={setPlannedDate}
          todayKey={todayKey}
          showDateInput={showMore || isOtherDay || isEvent}
          allowSomeday={!isEvent}
          label={isEvent ? t.fields.eventDay : undefined}
        />
        {/* Bei Terminen gehört die Uhrzeit dazu und steht gleich sichtbar da */}
        {isEvent && !minimized && (
          <>
            <TimeField time={time} reminder={reminder} onTimeChange={setChosenTime} onReminderChange={setReminder} />
            <RepeatField value={repeat} onChange={setRepeat} />
          </>
        )}

        {/* Ausgeklappter Teil: verschwindet weich, wenn das Fenster zum unteren Rand einklappt */}
        <div className="quick-add__expandable" data-collapsed={minimized} inert={minimized}>
          <div className="quick-add__expandable-inner">
            {!isEvent && (
              <button
                type="button"
                className="quick-add__more"
                aria-expanded={showMore}
                onClick={() => setShowMore(!showMore)}
              >
                {showMore ? t.quickAdd.less : t.quickAdd.more}
                <Icon name="chevronDown" size={18} />
              </button>
            )}

            {showMore && !isEvent && (
              <div className="quick-add__extra">
                {plannedDate && (
                  <>
                    <TimeField time={time} reminder={reminder} onTimeChange={setChosenTime} onReminderChange={setReminder} />
                    <RepeatField value={repeat} onChange={setRepeat} />
                  </>
                )}
                <DueDateField value={dueDate} onChange={setDueDate} todayKey={todayKey} />
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

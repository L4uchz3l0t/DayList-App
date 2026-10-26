import { useState, type FormEvent } from 'react'
import { DateField } from '../../components/DateField'
import { Sheet } from '../../components/Sheet'
import { TimeField } from '../../components/TaskFields'
import { useI18n } from '../../i18n/useI18n'
import { addDays, parseDateKey, toDateKey } from '../../tasks/dates'
import {
  addGroupSeries,
  addGroupTask,
  deleteGroupTask,
  stopGroupSeries,
  updateGroupSeries,
  updateGroupTask,
} from '../groupStore'
import type { Group, GroupSeries, GroupTask } from '../types'
import { Avatar } from './Avatar'
import { RotationEditor, type RotationEntry } from './RotationEditor'

interface GroupTaskSheetProps {
  group: Group
  /** Zu bearbeitende Aufgabe, null = neue Aufgabe zuteilen */
  task: GroupTask | null
  /** Vorauswahl der Person bei einer neuen Aufgabe */
  defaultAssignee: string
  todayKey: string
  /** Führt eine Änderung aus, zeigt Fehler an und lädt neu. true = hat geklappt */
  act: (action: () => Promise<unknown>, success?: string) => Promise<boolean>
  onClose: () => void
  closing?: boolean
}

/** Der Sonntag dieser Woche (heute, wenn heute Sonntag ist): ein typisches Ende für den Putzplan */
function endOfWeek(todayKey: string): string {
  const today = parseDateKey(todayKey)
  return toDateKey(addDays(today, (7 - today.getDay()) % 7))
}

const REPEAT_OPTIONS = [0, 1, 2] as const

/** Bei einer bestehenden Reihe deren Reihenfolge, sonst alle Mitglieder mit der gewählten Person vorn */
function initialRotation(group: Group, series: GroupSeries | undefined, first: string): RotationEntry[] {
  const name = (email: string) => group.members.find((member) => member.email === email)?.display_name ?? email
  if (series) {
    const rest = group.members.filter((member) => !series.rotation.includes(member.email))
    return [
      ...series.rotation.map((email) => ({ email, name: name(email), included: true })),
      ...rest.map((member) => ({ email: member.email, name: member.display_name, included: false })),
    ]
  }
  const members = [...group.members].sort((a, b) => Number(b.email === first) - Number(a.email === first))
  return members.map((member) => ({ email: member.email, name: member.display_name, included: true }))
}

/**
 * Aufgabe zuteilen oder bearbeiten (nur für Verwalter): Titel, Person, Frist, Uhrzeit mit Erinnerung
 * und bei neuen Aufgaben die Wiederholung reihum. Bei wiederkehrenden Aufgaben betrifft das Bearbeiten nur diese Runde.
 */
export function GroupTaskSheet({ group, task, defaultAssignee, todayKey, act, onClose, closing }: GroupTaskSheetProps) {
  const { t } = useI18n()
  const series = task?.series_id ? group.series.find((candidate) => candidate.id === task.series_id) : undefined
  const tomorrowKey = toDateKey(addDays(parseDateKey(todayKey), 1))
  const sundayKey = endOfWeek(todayKey)

  const [title, setTitle] = useState(task?.title ?? '')
  const [assignee, setAssignee] = useState(task?.assignee ?? defaultAssignee)
  const [due, setDue] = useState(task?.due_date ?? sundayKey)
  const [time, setTime] = useState(task?.time ?? '')
  const [reminder, setReminder] = useState<number | undefined>(task?.reminder ?? undefined)
  const [repeatWeeks, setRepeatWeeks] = useState<number>(0)
  const [rotation, setRotation] = useState<RotationEntry[]>(() =>
    initialRotation(group, series, task?.assignee ?? defaultAssignee),
  )
  const [editingRotation, setEditingRotation] = useState(false)
  const [confirm, setConfirm] = useState<'delete' | 'stop' | null>(null)
  const [busy, setBusy] = useState(false)

  const isNew = task === null
  const repeating = isNew && repeatWeeks > 0
  const included = rotation.filter((entry) => entry.included).map((entry) => entry.email)
  const canSave = title.trim() !== '' && due !== '' && (repeating ? included.length > 0 : assignee !== '')

  async function perform(action: () => Promise<unknown>, success?: string) {
    setBusy(true)
    const ok = await act(action, success)
    setBusy(false)
    if (ok) onClose()
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSave) return
    const fields = {
      title: title.trim(),
      time: time || null,
      reminder: time && reminder !== undefined ? reminder : null,
    }
    if (repeating) {
      void perform(() =>
        addGroupSeries(group.id, { ...fields, interval_weeks: repeatWeeks, rotation: included, first_due: due }),
      )
    } else if (isNew) {
      void perform(() => addGroupTask(group.id, { ...fields, assignee, due_date: due }))
    } else {
      void perform(() => updateGroupTask(task.id, { ...fields, assignee, due_date: due }))
    }
  }

  // Beim Wechsel der Person in einer neuen Aufgabe beginnt die Reihenfolge mit ihr
  function chooseAssignee(email: string) {
    setAssignee(email)
    if (isNew) {
      setRotation((entries) => [...entries].sort((a, b) => Number(b.email === email) - Number(a.email === email)))
    }
  }

  return (
    <Sheet title={isNew ? t.groups.assign : t.groups.editTask} onClose={onClose} closing={closing}>
      <form className="group-form" onSubmit={handleSubmit}>
        {series && <p className="group-form__note">{t.groups.seriesNote}</p>}

        <label className="task-field">
          <span className="task-field__label">{t.groups.taskTitle}</span>
          <input
            className="field"
            type="text"
            maxLength={200}
            placeholder={t.groups.taskTitlePlaceholder}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        {!repeating && (
          <div className="task-field">
            <span className="task-field__label" id="group-task-assignee">
              {t.groups.forWhom}
            </span>
            <div className="chips" role="radiogroup" aria-labelledby="group-task-assignee">
              {group.members.map((member) => (
                <button
                  key={member.email}
                  type="button"
                  role="radio"
                  aria-checked={assignee === member.email}
                  className="chip group-chip"
                  onClick={() => chooseAssignee(member.email)}
                >
                  <Avatar name={member.display_name} colorKey={member.email} size={22} />
                  {member.display_name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="task-field">
          <span className="task-field__label" id="group-task-due">
            {t.groups.until}
          </span>
          <div className="chips" role="radiogroup" aria-labelledby="group-task-due">
            {[
              { label: t.days.today, value: todayKey },
              { label: t.days.tomorrow, value: tomorrowKey },
              ...(sundayKey !== todayKey && sundayKey !== tomorrowKey
                ? [
                    {
                      label: new Intl.DateTimeFormat(t.locale, { weekday: 'long' }).format(parseDateKey(sundayKey)),
                      value: sundayKey,
                    },
                  ]
                : []),
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={due === option.value}
                className="chip"
                onClick={() => setDue(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <DateField label={t.groups.dueDate} value={due} onChange={setDue} todayKey={todayKey} />
        </div>

        <TimeField time={time} reminder={reminder} onTimeChange={setTime} onReminderChange={setReminder} />

        {isNew && (
          <div className="task-field">
            <span className="task-field__label" id="group-task-repeat">
              {t.groups.repeat}
            </span>
            <div className="chips" role="radiogroup" aria-labelledby="group-task-repeat">
              {REPEAT_OPTIONS.map((weeks) => (
                <button
                  key={weeks}
                  type="button"
                  role="radio"
                  aria-checked={repeatWeeks === weeks}
                  className="chip"
                  onClick={() => setRepeatWeeks(weeks)}
                >
                  {weeks === 0 ? t.groups.repeatNo : t.groups.repeatWeeks(weeks)}
                </button>
              ))}
            </div>
          </div>
        )}

        {(repeating || editingRotation) && <RotationEditor entries={rotation} onChange={setRotation} />}

        <div className="group-form__actions">
          {editingRotation && series ? (
            <button
              type="button"
              className="button button--primary"
              disabled={busy || included.length === 0}
              onClick={() =>
                void perform(() => updateGroupSeries(series.id, { rotation: included }), t.groups.rotationSaved)
              }
            >
              {t.groups.saveRotation}
            </button>
          ) : (
            <button type="submit" className="button button--primary" disabled={busy || !canSave}>
              {isNew ? t.groups.saveAssign : t.groups.save}
            </button>
          )}

          {series && !editingRotation && (
            <>
              <button
                type="button"
                className="button button--secondary"
                disabled={busy}
                onClick={() => void perform(() => updateGroupTask(task!.id, { skipped: true }))}
              >
                {t.groups.skipRound}
              </button>
              <button type="button" className="button button--secondary" onClick={() => setEditingRotation(true)}>
                {t.groups.editRotation}
              </button>
              <button
                type="button"
                className={`button ${confirm === 'stop' ? 'button--danger-strong' : 'button--danger'}`}
                disabled={busy}
                onClick={() =>
                  confirm === 'stop' ? void perform(() => stopGroupSeries(series.id, todayKey)) : setConfirm('stop')
                }
              >
                {confirm === 'stop' ? t.groups.confirmStop : t.groups.stopSeries}
              </button>
            </>
          )}

          {task && !series && (
            <button
              type="button"
              className={`button ${confirm === 'delete' ? 'button--danger-strong' : 'button--danger'}`}
              disabled={busy}
              onClick={() =>
                confirm === 'delete' ? void perform(() => deleteGroupTask(task.id)) : setConfirm('delete')
              }
            >
              {confirm === 'delete' ? t.groups.confirmDelete : t.groups.delete}
            </button>
          )}
        </div>
      </form>
    </Sheet>
  )
}

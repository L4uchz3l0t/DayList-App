import { useState, type FormEvent } from 'react'
import { AssistantError, deviceTimeZone, planWeek, type AnswerSource } from '../ai/assistant'
import { readAutoDetect, writeAutoDetect } from '../ai/autoDetect'
import type { BusySlot, PlanWeekResult } from '../ai/types'
import { useI18n } from '../i18n/useI18n'
import { addDays, formatWeekdayDate, parseDateKey, toDateKey } from '../tasks/dates'
import type { NewTaskInput } from '../tasks/taskOperations'
import type { Task } from '../tasks/types'
import './views.css'

interface AiViewProps {
  /** Alle Einträge inklusive Gruppen und Google, damit belegte Zeiten bekannt sind */
  tasks: Task[]
  todayKey: string
  signedIn: boolean
  onAdd: (input: NewTaskInput) => void
  onMessage: (text: string) => void
}

const pad = (value: number) => String(value).padStart(2, '0')

function plusHour(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  return `${pad(Math.min(23, hours + 1))}:${pad(minutes)}`
}

/** Was in den nächsten 7 Tagen schon im Kalender steht (Termine und Aufgaben mit Uhrzeit belegen Zeit) */
function busySlots(tasks: Task[], todayKey: string): BusySlot[] {
  const last = toDateKey(addDays(parseDateKey(todayKey), 7))
  return tasks
    .filter((task) => task.plannedDate && task.plannedDate > todayKey && task.plannedDate <= last && task.status === 'open')
    .map((task) => ({
      date: task.plannedDate!,
      from: task.time ?? '',
      to: task.time ? (task.google?.endTime ?? plusHour(task.time)) : '',
      title: task.title,
    }))
}

/**
 * Der Bereich "KI": Vorhaben für die Woche eingeben, Vorschläge ansehen, auswählen und erst dann eintragen.
 * Dazu die Einstellung, ob die Schnellaufnahme Aufgabe oder Termin selbst erkennt.
 */
export function AiView({ tasks, todayKey, signedIn, onAdd, onMessage }: AiViewProps) {
  const { t, language } = useI18n()
  const [wishes, setWishes] = useState('')
  const [busy, setBusy] = useState(false)
  const [plan, setPlan] = useState<{ result: PlanWeekResult; source: AnswerSource } | null>(null)
  const [picked, setPicked] = useState<boolean[]>([])
  const [error, setError] = useState<string | null>(null)
  const [autoDetect, setAutoDetect] = useState(readAutoDetect)

  async function handlePlan(event: FormEvent) {
    event.preventDefault()
    if (wishes.trim() === '') return
    setBusy(true)
    setError(null)
    try {
      const next = await planWeek(
        {
          action: 'planWeek',
          wishes: wishes.trim(),
          today: todayKey,
          timeZone: deviceTimeZone(),
          busy: busySlots(tasks, todayKey),
          openTasks: tasks
            .filter((task) => task.status === 'open' && !task.plannedDate && !task.group && !task.google)
            .map((task) => ({ id: task.id, title: task.title })),
        },
        { signedIn, language },
      )
      setPlan(next)
      setPicked(next.result.proposals.map(() => true))
    } catch (problem) {
      console.error('KI-Planung fehlgeschlagen', problem)
      setError(t.ai.error(problem instanceof AssistantError ? problem.message : String(problem)))
    } finally {
      setBusy(false)
    }
  }

  function handleAccept() {
    if (!plan) return
    const chosen = plan.result.proposals.filter((_, index) => picked[index])
    for (const proposal of chosen) {
      onAdd({
        title: proposal.title,
        kind: proposal.kind === 'event' ? 'event' : undefined,
        plannedDate: proposal.date,
        time: proposal.time,
      })
    }
    onMessage(t.ai.added(chosen.length))
    setPlan(null)
    setWishes('')
  }

  const pickedCount = picked.filter(Boolean).length

  return (
    <div className="ai-view">
      <p className="view-intro">{t.ai.intro}</p>

      <form className="ai-view__form" onSubmit={handlePlan}>
        <label className="task-field">
          <span className="task-field__label">{t.ai.wishesLabel}</span>
          <textarea
            className="field ai-view__wishes"
            rows={4}
            maxLength={2000}
            placeholder={t.ai.wishesPlaceholder}
            value={wishes}
            onChange={(event) => setWishes(event.target.value)}
          />
        </label>
        <button type="submit" className="button button--primary" disabled={busy || wishes.trim() === ''}>
          {busy ? t.ai.planning : t.ai.plan}
        </button>
      </form>

      {error && (
        <p className="ai-view__error" role="alert">
          {error}
        </p>
      )}

      {plan && (
        <section className="ai-view__plan" aria-labelledby="ai-proposals">
          <h2 id="ai-proposals" className="ai-view__heading">
            {t.ai.proposals}
          </h2>
          {plan.result.question && (
            <p className="ai-view__question" role="status">
              {plan.result.question}
            </p>
          )}
          {plan.result.proposals.length > 0 && (
            <ul className="ai-view__list">
              {plan.result.proposals.map((proposal, index) => (
                <li key={index}>
                  <label className={`ai-proposal${proposal.kind === 'event' ? ' ai-proposal--event' : ''}`}>
                    <input
                      type="checkbox"
                      className="ai-proposal__check"
                      checked={picked[index] ?? false}
                      onChange={(event) =>
                        setPicked((current) => current.map((value, i) => (i === index ? event.target.checked : value)))
                      }
                    />
                    <span className="ai-proposal__text">
                      <span className="ai-proposal__title">{proposal.title}</span>
                      <span className="ai-proposal__when">
                        {[
                          formatWeekdayDate(proposal.date, t.locale),
                          proposal.time && t.ai.at(proposal.time),
                          proposal.durationMinutes && t.ai.minutes(proposal.durationMinutes),
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                      {proposal.reason && <span className="ai-proposal__reason">{proposal.reason}</span>}
                    </span>
                    <span className="ai-proposal__kind">
                      {proposal.kind === 'event' ? t.fields.kindEvent : t.fields.kindTask}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <div className="settings__actions">
            {plan.result.proposals.length > 0 && (
              <button type="button" className="button button--primary" disabled={pickedCount === 0} onClick={handleAccept}>
                {t.ai.accept(pickedCount)}
              </button>
            )}
            <button type="button" className="button button--secondary" onClick={() => setPlan(null)}>
              {t.ai.discard}
            </button>
          </div>
          <p className="ai-view__source">{plan.source === 'cloud' ? t.ai.sourceCloud : t.ai.sourceDevice}</p>
        </section>
      )}

      <section className="settings__group ai-view__settings">
        <h2 className="settings__heading">{t.ai.autoHeading}</h2>
        <p className="settings__text">{t.ai.autoHint}</p>
        <label className="group-switch">
          <span>{t.ai.autoLabel}</span>
          <input
            type="checkbox"
            role="switch"
            className="group-switch__input"
            checked={autoDetect}
            onChange={(event) => {
              setAutoDetect(event.target.checked)
              writeAutoDetect(event.target.checked)
            }}
          />
        </label>
      </section>
    </div>
  )
}

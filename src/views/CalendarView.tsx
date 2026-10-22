import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useMemo, useRef, useState } from 'react'
import { DoneSection } from '../components/DoneSection'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { TaskItem } from '../components/TaskItem'
import { TaskSection } from '../components/TaskSection'
import { useSwipe } from '../components/useSwipe'
import {
  addDays,
  formatMonthYear,
  formatShortDate,
  formatWeekday,
  formatWeekdayDate,
  getMonthGrid,
  getWeekdayNames,
  parseDateKey,
  toDateKey,
} from '../tasks/dates'
import { countTasksByDay, getDay, getDayKind, getEventDays, getOverdueTasks, heatLevel } from '../tasks/taskViews'
import type { Task } from '../tasks/types'
import './views.css'
import { useI18n } from '../i18n/useI18n'

interface CalendarViewProps {
  tasks: Task[]
  todayKey: string
  onToggle: (id: string) => void
  onOpen: (id: string) => void
  onMove: (id: string) => void
  /** Aufgabe direkt auf einen Tag legen (nach dem Ziehen und Ablegen) */
  onMoveTo: (id: string, plannedDate: string) => void
  /** Schnellaufnahme mit diesem Tag öffnen */
  onAdd: (plannedDate: string) => void
}

interface CalendarDayProps {
  dateKey: string
  count: number
  /** An diesem Tag liegt mindestens ein Termin (kleiner Punkt) */
  hasEvent: boolean
  todayKey: string
  selected: boolean
  onSelect: (dateKey: string) => void
}

/** Ein Tag im Monat: antippen zeigt seine Aufgaben, und man kann Aufgaben darauf ziehen. */
function CalendarDay({ dateKey, count, hasEvent, todayKey, selected, onSelect }: CalendarDayProps) {
  const { t } = useI18n()
  const { setNodeRef, isOver } = useDroppable({ id: dateKey })
  const classes = [
    'calendar-view__day',
    `calendar-view__day--level-${heatLevel(count)}`,
    dateKey === todayKey && 'calendar-view__day--today',
    dateKey < todayKey && 'calendar-view__day--past',
    isOver && 'calendar-view__day--over',
  ]
  return (
    <button
      ref={setNodeRef}
      type="button"
      className={classes.filter(Boolean).join(' ')}
      aria-pressed={selected}
      aria-label={`${formatWeekdayDate(dateKey, t.locale)}, ${t.week.taskCount(count)}`}
      onClick={() => onSelect(dateKey)}
    >
      {parseDateKey(dateKey).getDate()}
      {hasEvent && <span className="calendar-view__event-dot" aria-hidden="true" />}
    </button>
  )
}

/**
 * Ein ganzer Monat als Kalender. Jeder Tag wird kräftiger grün, je mehr Aufgaben er hat; ein Punkt zeigt Termine.
 * Unter dem Kalender stehen erst die Termine, dann die Aufgaben des gewählten Tages.
 * Wischen innen wechselt den Monat (im Kalender) bzw. den Tag (darunter), Wischen vom Rand wechselt den Tab (App.tsx).
 * Aufgaben lassen sich auf einen anderen Tag ziehen:
 * am Computer mit der Maus, auf dem Handy nach kurzem Gedrückthalten (damit normales Scrollen weiter funktioniert).
 */
export function CalendarView({ tasks, todayKey, onToggle, onOpen, onMove, onMoveTo, onAdd }: CalendarViewProps) {
  const { t } = useI18n()
  const today = parseDateKey(todayKey)
  const [month, setMonth] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selectedKey, setSelectedKey] = useState(todayKey)
  // Richtung des letzten Wechsels, damit Monat und Tag von der passenden Seite hereingleiten
  const [direction, setDirection] = useState<'next' | 'previous' | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const draggedTask = tasks.find((task) => task.id === draggedId)
  // Nach dem Ablegen auf derselben Karte würde der Browser sonst noch einen Tipp auslösen
  const lastDropAt = useRef(0)

  const counts = useMemo(() => countTasksByDay(tasks), [tasks])
  const eventDays = useMemo(() => getEventDays(tasks), [tasks])
  const grid = getMonthGrid(month.year, month.month)
  const selected = getDay(tasks, selectedKey)
  const overdue = getOverdueTasks(tasks, todayKey)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  )

  function changeMonth(step: number) {
    setDirection(step > 0 ? 'next' : 'previous')
    setMonth(({ year, month }) => {
      const next = new Date(year, month + step, 1)
      return { year: next.getFullYear(), month: next.getMonth() }
    })
  }

  /** Vortag oder nächster Tag; liegt er in einem anderen Monat, blättert der Kalender mit. */
  function changeDay(step: number) {
    const next = addDays(parseDateKey(selectedKey), step)
    setDirection(step > 0 ? 'next' : 'previous')
    setSelectedKey(toDateKey(next))
    setMonth({ year: next.getFullYear(), month: next.getMonth() })
  }

  // Nur Wischen, das innen beginnt; vom Rand aus wechselt der Tab
  const monthSwipe = useSwipe(
    () => changeMonth(1),
    () => changeMonth(-1),
    draggedId !== null,
    'inner',
  )
  const daySwipe = useSwipe(
    () => changeDay(1),
    () => changeDay(-1),
    draggedId !== null,
    'inner',
  )
  const slideClass = direction ? ` calendar-view__slide--${direction}` : ''

  const titleOf = (id: string | number) => tasks.find((task) => task.id === id)?.title ?? ''
  const dayOf = (id: string | number) => formatWeekdayDate(String(id), t.locale)
  const announcements: Announcements = {
    onDragStart: ({ active }) => t.week.picked(titleOf(active.id)),
    onDragOver: ({ active, over }) => (over ? t.week.over(titleOf(active.id), dayOf(over.id)) : undefined),
    onDragEnd: ({ active, over }) =>
      over ? t.week.dropped(titleOf(active.id), dayOf(over.id)) : t.week.notMoved(titleOf(active.id)),
    onDragCancel: ({ active }) => t.week.cancelled(titleOf(active.id)),
  }

  function handleDragStart(event: DragStartEvent) {
    setDraggedId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggedId(null)
    lastDropAt.current = Date.now()
    if (event.over) onMoveTo(String(event.active.id), String(event.over.id))
  }

  const recentlyDropped = () => Date.now() - lastDropAt.current < 100
  const guardedOpen = (id: string) => !recentlyDropped() && onOpen(id)
  const guardedToggle = (id: string) => !recentlyDropped() && onToggle(id)
  const sectionProps = { todayKey, onToggle: guardedToggle, onOpen: guardedOpen, onMove, draggable: true }

  const kind = getDayKind(selectedKey, todayKey)
  const dayName =
    kind === 'today' ? t.days.today : kind === 'tomorrow' ? t.days.tomorrow : formatWeekday(selectedKey, t.locale)
  const openTasks = selected.tasks.filter((task) => task.status === 'open')
  const doneTasks = selected.tasks.filter((task) => task.status === 'done')

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggedId(null)}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable: t.week.dragHint,
        },
      }}
    >
      <section className="calendar-view" aria-label={formatMonthYear(month.year, month.month, t.locale)}>
        <div className="calendar-view__head">
          <h2 className="calendar-view__month">{formatMonthYear(month.year, month.month, t.locale)}</h2>
          <button
            type="button"
            className="calendar-view__nav"
            aria-label={t.fields.prevMonth}
            onClick={() => changeMonth(-1)}
          >
            <Icon name="chevronLeft" size={20} />
          </button>
          <button
            type="button"
            className="calendar-view__nav"
            aria-label={t.fields.nextMonth}
            onClick={() => changeMonth(1)}
          >
            <Icon name="chevronRight" size={20} />
          </button>
        </div>
        <div key={`${month.year}-${month.month}`} className={`calendar-view__grid${slideClass}`} {...monthSwipe}>
          {getWeekdayNames(t.locale).map((name) => (
            <span key={name} className="calendar-view__weekday" aria-hidden="true">
              {name}
            </span>
          ))}
          {grid.map((dateKey, index) =>
            dateKey ? (
              <CalendarDay
                key={dateKey}
                dateKey={dateKey}
                count={counts.get(dateKey) ?? 0}
                hasEvent={eventDays.has(dateKey)}
                todayKey={todayKey}
                selected={dateKey === selectedKey}
                onSelect={(dateKey) => {
                  setDirection(null)
                  setSelectedKey(dateKey)
                }}
              />
            ) : (
              <span key={`leer-${index}`} aria-hidden="true" />
            ),
          )}
        </div>
      </section>

      {/* Der ganze Bereich unter dem Kalender: Wischen innen wechselt zum Vortag oder nächsten Tag */}
      <div className="calendar-view__below" {...daySwipe}>
        <div key={selectedKey} className={`calendar-view__day-tasks${slideClass}`}>
          <h2 className="calendar-view__day-title">
            {dayName} · {formatShortDate(selectedKey, t.locale)}
          </h2>

          {selected.events.length > 0 && (
            <TaskSection
              title={t.sections.events}
              tone="event"
              tasks={selected.events}
              {...sectionProps}
              draggable={false}
            />
          )}

          <TaskSection
            title={t.sections.tasks}
            tasks={openTasks}
            {...sectionProps}
            action={
              <button
                type="button"
                className="week-view__add"
                aria-label={t.week.addFor(formatWeekdayDate(selectedKey, t.locale))}
                onClick={() => onAdd(selectedKey)}
              >
                <Icon name="plus" size={20} />
              </button>
            }
          >
            {openTasks.length === 0 && (
              <EmptyState
                title={doneTasks.length > 0 ? t.empty.noOpen : t.empty.nothingPlanned}
                compact
                onClick={() => onAdd(selectedKey)}
              />
            )}
            {selected.deadlines.map((task) => (
              <button key={task.id} type="button" className="week-view__deadline" onClick={() => onOpen(task.id)}>
                <Icon name="clock" size={16} />
                <span>
                  {t.week.deadline} <strong>{task.title}</strong>
                </span>
              </button>
            ))}
          </TaskSection>

          <DoneSection
            storageKey="calendar-done"
            tasks={doneTasks}
            todayKey={todayKey}
            onToggle={guardedToggle}
            onOpen={guardedOpen}
          />
        </div>

        {/* Überfälliges ist von Anfang an eingeklappt, damit der gewählte Tag übersichtlich bleibt */}
        {overdue.length > 0 && (
          <TaskSection
            title={t.sections.overdue}
            tone="danger"
            tasks={overdue}
            {...sectionProps}
            collapsible={{ storageKey: 'calendar-overdue', defaultCollapsed: true }}
          />
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {draggedTask && (
          <ul className="week-view__overlay task-section--accent">
            <TaskItem task={draggedTask} todayKey={todayKey} onToggle={() => {}} onOpen={() => {}} />
          </ul>
        )}
      </DragOverlay>
    </DndContext>
  )
}

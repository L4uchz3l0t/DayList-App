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
import {
  formatMonthYear,
  formatShortDate,
  formatWeekday,
  formatWeekdayDate,
  getMonthGrid,
  getWeekdayNames,
  parseDateKey,
} from '../tasks/dates'
import { countTasksByDay, getDay, getDayKind, getOverdueTasks, heatLevel } from '../tasks/taskViews'
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
  todayKey: string
  selected: boolean
  onSelect: (dateKey: string) => void
}

/** Ein Tag im Monat: antippen zeigt seine Aufgaben, und man kann Aufgaben darauf ziehen. */
function CalendarDay({ dateKey, count, todayKey, selected, onSelect }: CalendarDayProps) {
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
    </button>
  )
}

/**
 * Ein ganzer Monat als Kalender. Jeder Tag wird kräftiger grün, je mehr Aufgaben er hat.
 * Unter dem Kalender stehen die Aufgaben des gewählten Tages. Diese lassen sich auf einen anderen Tag ziehen:
 * am Computer mit der Maus, auf dem Handy nach kurzem Gedrückthalten (damit normales Scrollen weiter funktioniert).
 */
export function CalendarView({ tasks, todayKey, onToggle, onOpen, onMove, onMoveTo, onAdd }: CalendarViewProps) {
  const { t } = useI18n()
  const today = parseDateKey(todayKey)
  const [month, setMonth] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selectedKey, setSelectedKey] = useState(todayKey)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const draggedTask = tasks.find((task) => task.id === draggedId)
  // Nach dem Ablegen auf derselben Karte würde der Browser sonst noch einen Tipp auslösen
  const lastDropAt = useRef(0)

  const counts = useMemo(() => countTasksByDay(tasks), [tasks])
  const grid = getMonthGrid(month.year, month.month)
  const selected = getDay(tasks, selectedKey)
  const overdue = getOverdueTasks(tasks, todayKey)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  )

  function changeMonth(step: number) {
    setMonth(({ year, month }) => {
      const next = new Date(year, month + step, 1)
      return { year: next.getFullYear(), month: next.getMonth() }
    })
  }

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
  const dayName = kind === 'today' ? t.days.today : kind === 'tomorrow' ? t.days.tomorrow : formatWeekday(selectedKey, t.locale)
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
          <button type="button" className="calendar-view__nav" aria-label={t.fields.prevMonth} onClick={() => changeMonth(-1)}>
            <Icon name="chevronLeft" size={20} />
          </button>
          <button type="button" className="calendar-view__nav" aria-label={t.fields.nextMonth} onClick={() => changeMonth(1)}>
            <Icon name="chevronRight" size={20} />
          </button>
        </div>
        <div className="calendar-view__grid">
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
                todayKey={todayKey}
                selected={dateKey === selectedKey}
                onSelect={setSelectedKey}
              />
            ) : (
              <span key={`leer-${index}`} aria-hidden="true" />
            ),
          )}
        </div>
      </section>

      <TaskSection
        title={`${dayName} · ${formatShortDate(selectedKey, t.locale)}`}
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

      {overdue.length > 0 && <TaskSection title={t.sections.overdue} tone="danger" tasks={overdue} {...sectionProps} />}

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

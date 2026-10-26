import { addDays, parseDateKey, toDateKey } from './dates'
import { withRemindAt } from './taskOperations'
import type { Task, TaskRepeat } from './types'

/*
  Wiederholungen: Aus einem Eintrag mit `repeat` entsteht der nächste der Reihe.
  Die ID des Folge-Eintrags steht fest (Reihe + Tag), so entsteht er auch auf zwei Geräten nur einmal.
*/

/** Der nächste Tag der Wiederholung nach `dateKey` */
export function nextRepeatDate(dateKey: string, repeat: TaskRepeat): string {
  const date = parseDateKey(dateKey)
  switch (repeat) {
    case 'daily':
      return toDateKey(addDays(date, 1))
    case 'weekdays': {
      let next = addDays(date, 1)
      while (next.getDay() === 0 || next.getDay() === 6) next = addDays(next, 1)
      return toDateKey(next)
    }
    case 'weekly':
      return toDateKey(addDays(date, 7))
    case 'biweekly':
      return toDateKey(addDays(date, 14))
    case 'monthly':
    case 'yearly': {
      const months = repeat === 'monthly' ? 1 : 12
      const target = new Date(date.getFullYear(), date.getMonth() + months, 1)
      // Den 31. gibt es nicht in jedem Monat: dann der letzte Tag des Monats
      const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
      target.setDate(Math.min(date.getDate(), lastDay))
      return toDateKey(target)
    }
  }
}

const dayDiff = (from: string, to: string) =>
  Math.round((parseDateKey(to).getTime() - parseDateKey(from).getTime()) / 86_400_000)

/**
 * Der Folge-Eintrag einer Wiederholung: der erste Tag der Reihe nach `notBefore`
 * (bei Aufgaben nach heute, damit eine verspätet erledigte Aufgabe nicht gleich wieder überfällig ist).
 */
export function nextOccurrence(task: Task, afterKey: string, now: string): Task | null {
  if (!task.repeat || !task.plannedDate) return null
  let date = nextRepeatDate(task.plannedDate, task.repeat)
  while (date <= afterKey) date = nextRepeatDate(date, task.repeat)
  const seriesId = task.seriesId ?? task.id
  const next: Task = {
    id: `${seriesId}~${date}`,
    title: task.title,
    status: 'open',
    plannedDate: date,
    repeat: task.repeat,
    seriesId,
    createdAt: now,
    updatedAt: now,
  }
  if (task.kind) next.kind = task.kind
  if (task.time) next.time = task.time
  if (task.reminder !== undefined) next.reminder = task.reminder
  // Eine Frist wandert mit, im gleichen Abstand zum Tag
  if (task.dueDate) next.dueDate = toDateKey(addDays(parseDateKey(task.dueDate), dayDiff(task.plannedDate, date)))
  return withRemindAt(next)
}

/**
 * Termine mit Wiederholung: Ist ihr Tag erreicht, steht schon der nächste im Kalender.
 * Gibt die neuen Einträge und die geänderten alten zurück (die alten geben die Wiederholung ab).
 */
export function rollRepeatingEvents(tasks: Task[], todayKey: string, now: string): { created: Task[]; updated: Task[] } {
  const ids = new Set(tasks.map((task) => task.id))
  const created: Task[] = []
  const updated: Task[] = []
  for (const task of tasks) {
    if (task.kind !== 'event' || !task.repeat || !task.plannedDate || task.plannedDate > todayKey) continue
    // Termine: der nächste Tag nach dem Termin, der heute oder später liegt
    const next = nextOccurrence(task, toDateKey(addDays(parseDateKey(todayKey), -1)), now)
    if (!next) continue
    if (!ids.has(next.id)) {
      created.push(next)
      ids.add(next.id)
    }
    const { repeat: _repeat, ...rest } = task
    updated.push({ ...rest, nextId: next.id, updatedAt: now })
  }
  return { created, updated }
}

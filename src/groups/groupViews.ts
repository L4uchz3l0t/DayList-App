import { addDays, parseDateKey, toDateKey } from '../tasks/dates'
import type { Task } from '../tasks/types'
import type { Group, GroupMember, GroupTask } from './types'

/*
  Auswahl und Sortierung für die Gruppen-Ansichten. Reine Funktionen ohne Oberfläche, damit sie sich leicht testen lassen.
*/

/** Erledigte Aufgaben bleiben so viele Tage nach ihrer Frist sichtbar */
const SHOW_DONE_DAYS = 7

/** Gruppenaufgaben haben in Heute und im Kalender diese Vorsilbe vor ihrer ID */
const GROUP_TASK_PREFIX = 'g:'

export const toCalendarId = (taskId: string) => GROUP_TASK_PREFIX + taskId
export const isGroupTaskId = (id: string) => id.startsWith(GROUP_TASK_PREFIX)
export const fromCalendarId = (id: string) => id.slice(GROUP_TASK_PREFIX.length)

export function findMember(group: Group, email: string | null): GroupMember | undefined {
  return email ? group.members.find((member) => member.email === email.toLowerCase()) : undefined
}

export function isAdmin(group: Group, email: string | null): boolean {
  return findMember(group, email)?.role === 'admin'
}

/** Angepinnte Gruppen zuerst, sonst bleibt die Reihenfolge (nach Erstellung) */
export function sortGroups(groups: Group[], email: string | null): Group[] {
  const pinned = (group: Group) => Number(findMember(group, email)?.pinned ?? false)
  return [...groups].sort((a, b) => pinned(b) - pinned(a))
}

/** Anzeigename zu einer E-Mail-Adresse; ehemalige Mitglieder erscheinen mit ihrer Adresse */
export function nameOf(group: Group, email: string): string {
  return group.members.find((member) => member.email === email)?.display_name ?? email
}

/** Offene Aufgaben nach Frist, danach erledigte; ausgelassene und lange erledigte fallen weg */
function visible(tasks: GroupTask[], todayKey: string): GroupTask[] {
  const oldest = toDateKey(addDays(parseDateKey(todayKey), -SHOW_DONE_DAYS))
  const shown = tasks.filter((task) => !task.skipped && (task.done_at === null || task.due_date >= oldest))
  const byDue = (a: GroupTask, b: GroupTask) => a.due_date.localeCompare(b.due_date) || (a.time ?? '').localeCompare(b.time ?? '')
  return [...shown.filter((task) => task.done_at === null).sort(byDue), ...shown.filter((task) => task.done_at !== null).sort(byDue)]
}

/** "Für dich": die eigenen Aufgaben dieser Gruppe */
export function tasksFor(group: Group, email: string | null, todayKey: string): GroupTask[] {
  if (!email) return []
  return visible(group.tasks.filter((task) => task.assignee === email.toLowerCase()), todayKey)
}

/** Anzahl der offenen Aufgaben einer Person (für die Gruppen-Übersicht) */
export function openCountFor(group: Group, email: string | null): number {
  if (!email) return 0
  return group.tasks.filter((task) => task.assignee === email.toLowerCase() && task.done_at === null && !task.skipped).length
}

export interface PersonTasks {
  email: string
  name: string
  tasks: GroupTask[]
}

/** "Die anderen": alle übrigen Personen mit ihren Aufgaben, in der Reihenfolge der Mitgliederliste */
export function tasksOfOthers(group: Group, email: string | null, todayKey: string): PersonTasks[] {
  const me = email?.toLowerCase()
  const shown = visible(group.tasks, todayKey).filter((task) => task.assignee !== me)
  const people = group.members.filter((member) => member.email !== me).map((member) => member.email)
  // Aufgaben von Personen, die nicht mehr in der Gruppe sind
  for (const task of shown) if (!people.includes(task.assignee)) people.push(task.assignee)
  return people.map((person) => ({
    email: person,
    name: nameOf(group, person),
    tasks: shown.filter((task) => task.assignee === person),
  }))
}

/**
 * Die eigenen Gruppenaufgaben als normale Aufgaben für Heute und den Kalender,
 * aus allen Gruppen, in denen "Im Kalender zeigen" eingeschaltet ist.
 */
export function toCalendarTasks(groups: Group[], email: string | null): Task[] {
  if (!email) return []
  const result: Task[] = []
  for (const group of groups) {
    const me = findMember(group, email)
    if (!me?.show_in_calendar) continue
    for (const task of group.tasks) {
      if (task.assignee !== me.email || task.skipped) continue
      const calendarTask: Task = {
        id: toCalendarId(task.id),
        title: task.title,
        status: task.done_at ? 'done' : 'open',
        plannedDate: task.due_date,
        createdAt: task.due_date,
        updatedAt: task.done_at ?? task.due_date,
        group: { id: group.id, name: group.name },
      }
      if (task.time) calendarTask.time = task.time
      if (task.time && task.reminder !== null) calendarTask.reminder = task.reminder
      result.push(calendarTask)
    }
  }
  return result
}

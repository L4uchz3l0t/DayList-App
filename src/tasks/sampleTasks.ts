import { addDays, toDateKey } from './dates'
import type { Task } from './types'

/**
 * Beispieldaten für Phase 2, damit wir das Layout sehen können.
 * Ab Phase 3 und 4 kommen echte, gespeicherte Aufgaben dazu.
 */
export function createSampleTasks(today: Date): Task[] {
  const day = (offset: number) => toDateKey(addDays(today, offset))
  const now = new Date().toISOString()
  const task = (id: string, fields: Partial<Task> & Pick<Task, 'title'>): Task => ({
    id,
    status: 'open',
    createdAt: now,
    updatedAt: now,
    ...fields,
  })

  return [
    task('1', { title: 'Steuererklärung abschicken', plannedDate: day(-2), dueDate: day(-1), priority: 'high' }),
    task('2', { title: 'Paket zur Post bringen', plannedDate: day(-1) }),
    task('3', { title: 'Arzttermin vereinbaren', plannedDate: day(0), priority: 'high' }),
    task('4', { title: 'Milch und Brot kaufen', plannedDate: day(0) }),
    task('5', { title: 'Mama zurückrufen', plannedDate: day(0) }),
    task('6', { title: 'Wäsche waschen', plannedDate: day(0), status: 'done' }),
    task('7', { title: 'Miete überweisen', plannedDate: day(2), dueDate: day(3) }),
    task('8', { title: 'Idee: Geburtstagsgeschenk für Tom' }),
  ]
}

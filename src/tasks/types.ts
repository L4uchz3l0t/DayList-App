/**
 * So sieht eine Aufgabe aus.
 * Daten werden als Text im Format "JJJJ-MM-TT" gespeichert (zum Beispiel "2026-10-19").
 */
export type TaskStatus = 'open' | 'done'

export type TaskPriority = 'low' | 'normal' | 'high'

export interface Task {
  id: string
  title: string
  status: TaskStatus
  /** Tag, an dem ich die Aufgabe erledigen möchte. Leer = Aufgabe liegt unter Irgendwann. */
  plannedDate?: string
  /** Verbindliche Frist. Unabhängig vom geplanten Tag. */
  dueDate?: string
  priority?: TaskPriority
  /** Zeitpunkt der Erstellung (ISO-Zeitstempel) */
  createdAt: string
  /** Zeitpunkt der letzten Änderung (ISO-Zeitstempel) */
  updatedAt: string
}

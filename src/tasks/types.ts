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
  /** Uhrzeit am geplanten Tag als "HH:MM". Leer = irgendwann am Tag. */
  time?: string
  /** Erinnerung so viele Minuten vor der Uhrzeit (0 = genau zur Uhrzeit). Leer = keine Erinnerung. */
  reminder?: number
  /**
   * Zeitpunkt der Erinnerung (ISO-Zeitstempel), wird aus Tag, Uhrzeit und Erinnerung berechnet.
   * Der Erinnerungsdienst in der Cloud braucht ihn, weil er die Zeitzone des Geräts nicht kennt.
   */
  remindAt?: string
  /**
   * Nur bei Aufgaben aus einer Gruppe, die in Heute und im Kalender mit angezeigt werden.
   * Solche Aufgaben werden nicht auf dem Gerät gespeichert, sie kommen aus der Cloud (siehe groups/).
   */
  group?: { id: string; name: string }
  /** Zeitpunkt der Erstellung (ISO-Zeitstempel) */
  createdAt: string
  /** Zeitpunkt der letzten Änderung (ISO-Zeitstempel) */
  updatedAt: string
}

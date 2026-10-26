/**
 * So sieht eine Aufgabe aus.
 * Daten werden als Text im Format "JJJJ-MM-TT" gespeichert (zum Beispiel "2026-10-19").
 */
export type TaskStatus = 'open' | 'done'

export type TaskPriority = 'low' | 'normal' | 'high'

/** Wie oft sich eine Aufgabe oder ein Termin wiederholt */
export type TaskRepeat = 'daily' | 'weekdays' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'

export const REPEATS: TaskRepeat[] = ['daily', 'weekdays', 'weekly', 'biweekly', 'monthly', 'yearly']

/** Aufgabe (zum Abhaken) oder Termin (feste Zeit an einem Tag, wird nicht abgehakt) */
export type TaskKind = 'task' | 'event'

export interface Task {
  id: string
  title: string
  status: TaskStatus
  /** Tag, an dem ich die Aufgabe erledigen möchte. Leer = Aufgabe liegt unter Irgendwann. */
  plannedDate?: string
  /** Leer = Aufgabe. Termine haben immer einen Tag und keine Frist. */
  kind?: TaskKind
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
  /**
   * Nur bei Terminen aus dem Google Kalender: nur angezeigt, nicht auf dem Gerät gespeichert und nicht änderbar.
   * `link` öffnet den Termin in Google Kalender.
   */
  google?: { link: string; calendar: string; location?: string; endTime?: string }
  /**
   * Wiederholung. Nur mit geplantem Tag. Wird eine Aufgabe erledigt (oder ist der Tag eines Termins erreicht),
   * entsteht der nächste Eintrag der Reihe; der alte behält die Wiederholung dann nicht mehr.
   */
  repeat?: TaskRepeat
  /** Erster Eintrag einer Wiederholung; daraus entstehen die IDs der Folge-Einträge */
  seriesId?: string
  /** ID des Folge-Eintrags, der beim Erledigen entstanden ist (für "wieder öffnen") */
  nextId?: string
  /** Zeitpunkt, an dem die Aufgabe erledigt wurde (ISO-Zeitstempel). Nur bei erledigten Aufgaben. */
  doneAt?: string
  /** Zeitpunkt der Erstellung (ISO-Zeitstempel) */
  createdAt: string
  /** Zeitpunkt der letzten Änderung (ISO-Zeitstempel) */
  updatedAt: string
}

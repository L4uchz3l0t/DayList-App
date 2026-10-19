/*
  Alle Texte der Oberfläche, je Sprache an einer Stelle.
  Texte mit Platzhaltern sind kleine Funktionen, zum Beispiel deleted('Milch') → „Milch“ gelöscht.
  Eine neue Sprache braucht nur ein weiteres Objekt mit denselben Einträgen.
*/

const q = (title: string) => `„${title}“`

export const de = {
  locale: 'de-DE',
  nav: {
    today: 'Heute',
    week: 'Woche',
    someday: 'Irgendwann',
    all: 'Alle',
    settings: 'Einstellungen',
    settingsShort: 'Optionen',
    label: 'Hauptnavigation',
  },
  days: { today: 'Heute', tomorrow: 'Morgen', someday: 'Irgendwann' },
  sections: {
    overdue: 'Überfällig',
    today: 'Heute',
    done: 'Erledigt',
    noDay: 'Ohne Tag',
    planned: 'Geplant',
  },
  common: {
    close: 'Schließen',
    save: 'Speichern',
    retry: 'Erneut versuchen',
    undo: 'Rückgängig',
    important: 'Wichtig',
  },
  status: {
    loading: 'Aufgaben werden geladen …',
    loadError:
      'Deine Aufgaben konnten nicht geladen werden. Im privaten Modus mancher Browser ist das Speichern gesperrt.',
    saveError: 'Speichern fehlgeschlagen. Bitte lade die Seite neu.',
  },
  header: {
    lightOn: 'Helles Design einschalten',
    darkOn: 'Dunkles Design einschalten',
  },
  progress: {
    label: 'Fortschritt heute',
    nothingPlanned: 'Für heute ist nichts geplant',
    count: (done: number, total: number) => `${done} von ${total} erledigt`,
  },
  empty: {
    noTasks: 'Noch keine Aufgaben.',
    allDone: 'Alles erledigt für heute.',
    tapToAdd: 'Tippe hier, um eine neue Aufgabe hinzuzufügen.',
    somedayEmpty: 'Hier liegt gerade nichts.',
    somedayTap: 'Tippe hier, um schnell etwas zu notieren.',
    nothingPlanned: 'Nichts geplant',
    dropHere: 'Hier ablegen',
    noOpen: 'Keine offenen Aufgaben.',
    notFound: (query: string) => `Nichts gefunden für ${q(query)}.`,
    doneHidden: (count: number) => `${count} erledigte Aufgaben sind ausgeblendet.`,
  },
  someday: { intro: 'Alles ohne festen Tag. Tippe auf den Kalender, um etwas einzuplanen.' },
  all: { search: 'Aufgaben durchsuchen …', searchLabel: 'Aufgaben durchsuchen', showDone: 'Erledigte zeigen' },
  week: {
    addFor: (day: string) => `Aufgabe für ${day} hinzufügen`,
    deadline: 'Frist:',
    dragHint: 'Zum Verschieben lieber den Kalender-Knopf rechts an der Aufgabe verwenden.',
    picked: (title: string) => `${q(title)} aufgenommen.`,
    over: (title: string, day: string) => `${q(title)} über ${day}.`,
    dropped: (title: string, day: string) => `${q(title)} auf ${day} gelegt.`,
    notMoved: (title: string) => `${q(title)} nicht verschoben.`,
    cancelled: (title: string) => `Verschieben von ${q(title)} abgebrochen.`,
  },
  task: {
    complete: (title: string) => `${q(title)} erledigen`,
    reopen: (title: string) => `${q(title)} wieder öffnen`,
    move: (title: string) => `${q(title)} verschieben`,
    schedule: (title: string) => `${q(title)} einplanen`,
    moveShort: 'Verschieben',
    scheduleShort: 'Einplanen',
    plannedOn: (date: string) => `geplant ${date}`,
  },
  quickAdd: {
    title: 'Neue Aufgabe',
    placeholder: 'Was möchtest du nicht vergessen?',
    inputLabel: 'Titel der Aufgabe',
    more: 'Mehr Optionen',
    less: 'Weniger Optionen',
    saved: (title: string, day: string) => `✓ ${q(title)} gespeichert (${day})`,
  },
  detail: {
    title: 'Aufgabe bearbeiten',
    titleField: 'Titel',
    done: 'Erledigt',
    reopen: 'Wieder öffnen',
    delete: 'Löschen',
    confirmDelete: 'Wirklich löschen?',
  },
  fields: {
    plannedFor: 'Geplant für',
    otherDay: 'Anderer Tag',
    otherDayPlaceholder: 'Anderer Tag …',
    deadline: 'Frist (verbindlich, optional)',
    deadlineShort: 'Frist',
    noDeadline: 'Keine Frist',
    noDate: 'kein Datum',
    pickDate: 'Datum wählen',
    calendar: (label: string) => `Kalender ${label}`,
    prevMonth: 'Vorheriger Monat',
    nextMonth: 'Nächster Monat',
  },
  move: { titleMove: 'Verschieben', titleSchedule: 'Einplanen', newDay: 'Neuer Tag' },
  toast: {
    toSomeday: 'Nach „Irgendwann“ verschoben',
    toToday: 'Für heute eingeplant',
    movedTo: (day: string) => `Verschoben auf ${day}`,
    saved: 'Gespeichert',
    deleted: (title: string) => `${q(title)} gelöscht`,
  },
  settings: {
    language: 'Sprache',
    design: 'Design',
    designSystem: 'Wie Gerät',
    designLight: 'Hell',
    designDark: 'Dunkel',
    about: 'Deine Aufgaben werden nur auf diesem Gerät in diesem Browser gespeichert.',
  },
}

export type Messages = typeof de

const qEn = (title: string) => `“${title}”`

export const en: Messages = {
  locale: 'en-GB',
  nav: {
    today: 'Today',
    week: 'Week',
    someday: 'Someday',
    all: 'All',
    settings: 'Settings',
    settingsShort: 'Settings',
    label: 'Main navigation',
  },
  days: { today: 'Today', tomorrow: 'Tomorrow', someday: 'Someday' },
  sections: { overdue: 'Overdue', today: 'Today', done: 'Done', noDay: 'No day', planned: 'Planned' },
  common: { close: 'Close', save: 'Save', retry: 'Try again', undo: 'Undo', important: 'Important' },
  status: {
    loading: 'Loading tasks …',
    loadError: 'Your tasks could not be loaded. Some browsers block storage in private mode.',
    saveError: 'Saving failed. Please reload the page.',
  },
  header: { lightOn: 'Switch to light design', darkOn: 'Switch to dark design' },
  progress: {
    label: 'Progress today',
    nothingPlanned: 'Nothing planned for today',
    count: (done, total) => `${done} of ${total} done`,
  },
  empty: {
    noTasks: 'No tasks yet.',
    allDone: 'All done for today.',
    tapToAdd: 'Tap here to add a new task.',
    somedayEmpty: 'Nothing here right now.',
    somedayTap: 'Tap here to jot something down.',
    nothingPlanned: 'Nothing planned',
    dropHere: 'Drop here',
    noOpen: 'No open tasks.',
    notFound: (query) => `Nothing found for ${qEn(query)}.`,
    doneHidden: (count) => `${count} completed tasks are hidden.`,
  },
  someday: { intro: 'Everything without a fixed day. Tap the calendar to schedule it.' },
  all: { search: 'Search tasks …', searchLabel: 'Search tasks', showDone: 'Show completed' },
  week: {
    addFor: (day) => `Add task for ${day}`,
    deadline: 'Deadline:',
    dragHint: 'To move a task, use the calendar button on the right of the task.',
    picked: (title) => `Picked up ${qEn(title)}.`,
    over: (title, day) => `${qEn(title)} over ${day}.`,
    dropped: (title, day) => `${qEn(title)} dropped on ${day}.`,
    notMoved: (title) => `${qEn(title)} not moved.`,
    cancelled: (title) => `Moving ${qEn(title)} cancelled.`,
  },
  task: {
    complete: (title) => `Complete ${qEn(title)}`,
    reopen: (title) => `Reopen ${qEn(title)}`,
    move: (title) => `Move ${qEn(title)}`,
    schedule: (title) => `Schedule ${qEn(title)}`,
    moveShort: 'Move',
    scheduleShort: 'Schedule',
    plannedOn: (date) => `planned ${date}`,
  },
  quickAdd: {
    title: 'New task',
    placeholder: 'What don’t you want to forget?',
    inputLabel: 'Task title',
    more: 'More options',
    less: 'Fewer options',
    saved: (title, day) => `✓ ${qEn(title)} saved (${day})`,
  },
  detail: {
    title: 'Edit task',
    titleField: 'Title',
    done: 'Done',
    reopen: 'Reopen',
    delete: 'Delete',
    confirmDelete: 'Really delete?',
  },
  fields: {
    plannedFor: 'Planned for',
    otherDay: 'Other day',
    otherDayPlaceholder: 'Other day …',
    deadline: 'Deadline (binding, optional)',
    deadlineShort: 'Deadline',
    noDeadline: 'No deadline',
    noDate: 'no date',
    pickDate: 'Pick a date',
    calendar: (label) => `Calendar ${label}`,
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
  },
  move: { titleMove: 'Move', titleSchedule: 'Schedule', newDay: 'New day' },
  toast: {
    toSomeday: 'Moved to “Someday”',
    toToday: 'Scheduled for today',
    movedTo: (day) => `Moved to ${day}`,
    saved: 'Saved',
    deleted: (title) => `${qEn(title)} deleted`,
  },
  settings: {
    language: 'Language',
    design: 'Design',
    designSystem: 'Like device',
    designLight: 'Light',
    designDark: 'Dark',
    about: 'Your tasks are only stored on this device, in this browser.',
  },
}

export type Language = 'de' | 'en'

export const MESSAGES: Record<Language, Messages> = { de, en }

/** Namen der Sprachen, jeweils in der eigenen Sprache */
export const LANGUAGE_NAMES: Record<Language, string> = { de: 'Deutsch', en: 'English' }

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
    week: 'Kalender',
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
    taskCount: (count: number) => (count === 1 ? '1 Aufgabe' : `${count} Aufgaben`),
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
    at: (time: string) => `${time} Uhr`,
    withReminder: 'mit Erinnerung',
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
    time: 'Uhrzeit (optional)',
    noTime: 'Keine Uhrzeit',
    reminder: 'Erinnerung',
    reminderOption: (minutes: number | undefined) =>
      minutes === undefined
        ? 'Keine'
        : minutes === 0
          ? 'Zur Uhrzeit'
          : minutes < 60
            ? `${minutes} Min. vorher`
            : minutes < 24 * 60
              ? `${minutes / 60} Std. vorher`
              : `${minutes / (24 * 60)} Tag vorher`,
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
    aboutCloud: 'Deine Aufgaben liegen auf diesem Gerät und werden automatisch in deinem Konto gesichert.',
  },
  cloud: {
    heading: 'Automatische Sicherung',
    intro:
      'Melde dich mit deiner E-Mail-Adresse an. Dann sichert die App jede Änderung von selbst und holt deine Aufgaben auf jedem Gerät zurück.',
    emailLabel: 'E-Mail-Adresse',
    sendCode: 'Code schicken',
    codeSent: (email: string) => `Wir haben dir einen Code an ${email} geschickt.`,
    codeHint: 'Gib den Code aus der E-Mail hier ein. Das klappt auf jedem Gerät, auch wenn du die E-Mail woanders liest.',
    codeLabel: 'Code aus der E-Mail',
    signIn: 'Anmelden',
    otherEmail: 'Andere Adresse',
    signedInAs: (email: string) => `Angemeldet als ${email}`,
    syncing: 'Wird gesichert …',
    synced: (when: string) => `Zuletzt gesichert: ${when}`,
    neverSynced: 'Noch nicht gesichert',
    offline: 'Kein Internet. Die App sichert, sobald du wieder online bist.',
    error: 'Sichern hat gerade nicht geklappt. Die App versucht es später noch einmal.',
    syncNow: 'Jetzt sichern',
    signOut: 'Abmelden',
    sendFailed: 'Die E-Mail konnte nicht verschickt werden. Prüfe die Adresse und versuch es gleich noch einmal.',
    rateLimited:
      'Gerade wurden zu viele Anmelde-E-Mails verschickt. Nimm den Code aus der letzten E-Mail, oder versuch es später noch einmal.',
    wrongCode: 'Der Code stimmt nicht oder ist abgelaufen. Lass dir einen neuen schicken.',
  },
  reminders: {
    heading: 'Erinnerungen',
    intro:
      'Erinnerungen kommen als Benachrichtigung auf dieses Gerät, auch wenn die App geschlossen ist. Stell dafür bei einer Aufgabe eine Uhrzeit und eine Erinnerung ein.',
    needsSignIn: 'Melde dich zuerst oben bei der automatischen Sicherung an. Der Erinnerungsdienst arbeitet mit deinen gesicherten Aufgaben.',
    needsInstall:
      'Auf dem iPhone und iPad gehen Benachrichtigungen nur, wenn DayList auf dem Home-Bildschirm liegt (Teilen → Zum Home-Bildschirm). Öffne die App dann von dort.',
    unsupported: 'Dieser Browser kann leider keine Benachrichtigungen empfangen.',
    denied: 'Benachrichtigungen sind für DayList blockiert. Erlaube sie in den Einstellungen des Browsers oder Handys und öffne die App neu.',
    on: 'Erinnerungen sind auf diesem Gerät eingeschaltet.',
    enable: 'Erinnerungen einschalten',
    disable: 'Ausschalten',
    test: 'Test-Nachricht schicken',
    testSent: 'Test verschickt. Die Nachricht sollte gleich erscheinen.',
    failed: 'Das hat nicht geklappt. Ist der Erinnerungsdienst in Supabase eingerichtet?',
  },
  backup: {
    heading: 'Sicherung als Datei',
    intro: 'Speichert alle Aufgaben als Datei in deinen Downloads. Leg sie am besten zusätzlich in deine Cloud oder schick sie dir per Mail.',
    save: 'Aufgaben sichern',
    load: 'Sicherung laden',
    loadHint: 'Beim Laden kommen fehlende Aufgaben dazu. Es wird nichts gelöscht.',
    lastBackup: (when: string) => `Zuletzt gesichert: ${when}`,
    never: 'Noch nie gesichert',
    saved: 'Sicherung gespeichert',
    loaded: (added: number, updated: number) =>
      `Sicherung geladen: ${added} neu, ${updated} aktualisiert`,
    nothingNew: 'Sicherung geladen, alle Aufgaben waren schon da',
    invalid: 'Diese Datei ist keine DayList-Sicherung',
    fileName: 'daylist-sicherung',
  },
}

export type Messages = typeof de

const qEn = (title: string) => `“${title}”`

export const en: Messages = {
  locale: 'en-GB',
  nav: {
    today: 'Today',
    week: 'Calendar',
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
    taskCount: (count) => (count === 1 ? '1 task' : `${count} tasks`),
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
    at: (time) => time,
    withReminder: 'with reminder',
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
    time: 'Time (optional)',
    noTime: 'No time',
    reminder: 'Reminder',
    reminderOption: (minutes) =>
      minutes === undefined
        ? 'None'
        : minutes === 0
          ? 'At the time'
          : minutes < 60
            ? `${minutes} min before`
            : minutes < 24 * 60
              ? `${minutes / 60} h before`
              : `${minutes / (24 * 60)} day before`,
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
    aboutCloud: 'Your tasks are stored on this device and backed up to your account automatically.',
  },
  cloud: {
    heading: 'Automatic backup',
    intro: 'Sign in with your email address. The app then backs up every change by itself and restores your tasks on any device.',
    emailLabel: 'Email address',
    sendCode: 'Send code',
    codeSent: (email) => `We sent a code to ${email}.`,
    codeHint: 'Enter the code from the email here. This works on any device, even if you read the email somewhere else.',
    codeLabel: 'Code from the email',
    signIn: 'Sign in',
    otherEmail: 'Different address',
    signedInAs: (email) => `Signed in as ${email}`,
    syncing: 'Backing up …',
    synced: (when) => `Last backup: ${when}`,
    neverSynced: 'Not backed up yet',
    offline: 'No internet. The app will back up as soon as you are online again.',
    error: 'Backing up did not work just now. The app will try again later.',
    syncNow: 'Back up now',
    signOut: 'Sign out',
    sendFailed: 'The email could not be sent. Check the address and try again in a moment.',
    rateLimited:
      'Too many sign-in emails were sent just now. Use the code from the last email, or try again later.',
    wrongCode: 'The code is wrong or has expired. Request a new one.',
  },
  reminders: {
    heading: 'Reminders',
    intro: 'Reminders arrive as notifications on this device, even when the app is closed. Set a time and a reminder on a task.',
    needsSignIn: 'Sign in to automatic backup above first. The reminder service works with your backed-up tasks.',
    needsInstall:
      'On iPhone and iPad, notifications only work when DayList is on the home screen (Share → Add to Home Screen). Then open the app from there.',
    unsupported: 'This browser cannot receive notifications.',
    denied: 'Notifications are blocked for DayList. Allow them in your browser or phone settings and reopen the app.',
    on: 'Reminders are turned on for this device.',
    enable: 'Turn on reminders',
    disable: 'Turn off',
    test: 'Send test notification',
    testSent: 'Test sent. The notification should appear shortly.',
    failed: 'That did not work. Is the reminder service set up in Supabase?',
  },
  backup: {
    heading: 'Backup file',
    intro: 'Saves all tasks as a file in your downloads. Ideally also put it in your cloud or email it to yourself.',
    save: 'Back up tasks',
    load: 'Load backup',
    loadHint: 'Loading adds missing tasks. Nothing gets deleted.',
    lastBackup: (when) => `Last backup: ${when}`,
    never: 'Never backed up',
    saved: 'Backup saved',
    loaded: (added, updated) => `Backup loaded: ${added} new, ${updated} updated`,
    nothingNew: 'Backup loaded, all tasks were already here',
    invalid: 'This file is not a DayList backup',
    fileName: 'daylist-backup',
  },
}

export type Language = 'de' | 'en'

export const MESSAGES: Record<Language, Messages> = { de, en }

/** Namen der Sprachen, jeweils in der eigenen Sprache */
export const LANGUAGE_NAMES: Record<Language, string> = { de: 'Deutsch', en: 'English' }

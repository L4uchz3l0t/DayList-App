import { useRef, useState, type ChangeEvent } from 'react'
import { backupFileName, createBackup, InvalidBackupError, parseBackup, type MergeResult } from '../storage/backup'
import { addDays, parseDateKey, toDateKey } from '../tasks/dates'
import type { Task } from '../tasks/types'
import { useI18n } from '../i18n/useI18n'

const LAST_BACKUP_KEY = 'lastBackup'
/** Nach so vielen Tagen ohne Sicherung wird der Hinweis auffällig */
const REMIND_AFTER_DAYS = 7

function readLastBackup(): string | null {
  try {
    return localStorage.getItem(LAST_BACKUP_KEY)
  } catch {
    return null
  }
}

/** Lässt den Browser eine Datei herunterladen, ohne Server. */
function downloadFile(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

interface BackupSettingsProps {
  tasks: Task[]
  todayKey: string
  onImport: (tasks: Task[]) => MergeResult
  /** Kurze Rückmeldung als Meldung am unteren Rand */
  onMessage: (text: string) => void
}

/** Optionen-Karte "Datensicherung": alle Aufgaben als Datei sichern oder eine Sicherung wieder laden. */
export function BackupSettings({ tasks, todayKey, onImport, onMessage }: BackupSettingsProps) {
  const { t } = useI18n()
  const [lastBackup, setLastBackup] = useState(readLastBackup)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleSave() {
    const now = new Date().toISOString()
    downloadFile(backupFileName(todayKey, t.backup.fileName), createBackup(tasks, now))
    try {
      localStorage.setItem(LAST_BACKUP_KEY, now)
    } catch {
      // Ohne Speicher wird nur der Hinweis nicht gemerkt, die Sicherung selbst klappt
    }
    setLastBackup(now)
    onMessage(t.backup.saved)
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Zurücksetzen, damit dieselbe Datei später noch einmal gewählt werden kann
    event.target.value = ''
    if (!file) return
    try {
      const result = onImport(parseBackup(await file.text()))
      const changed = result.added + result.updated
      onMessage(changed === 0 ? t.backup.nothingNew : t.backup.loaded(result.added, result.updated))
    } catch (error) {
      if (!(error instanceof InvalidBackupError)) console.error('Sicherung laden fehlgeschlagen', error)
      onMessage(t.backup.invalid)
    }
  }

  // Hinweis auffällig machen, wenn nie oder vor mehr als REMIND_AFTER_DAYS Tagen gesichert wurde
  const remindBefore = toDateKey(addDays(parseDateKey(todayKey), -REMIND_AFTER_DAYS))
  const needsReminder = !lastBackup || toDateKey(new Date(lastBackup)) < remindBefore
  const status = lastBackup
    ? t.backup.lastBackup(new Date(lastBackup).toLocaleString(t.locale, { dateStyle: 'medium', timeStyle: 'short' }))
    : t.backup.never

  return (
    <section className="settings__group">
      <h2 className="settings__heading">{t.backup.heading}</h2>
      <p className="settings__text">{t.backup.intro}</p>
      <p className={`settings__text settings__status${needsReminder ? ' settings__status--warn' : ''}`}>
        {status}
      </p>
      <div className="settings__actions">
        <button type="button" className="button button--primary" onClick={handleSave}>
          {t.backup.save}
        </button>
        <button type="button" className="button button--secondary" onClick={() => fileInputRef.current?.click()}>
          {t.backup.load}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          hidden
          aria-label={t.backup.load}
          onChange={handleFile}
        />
      </div>
      <p className="settings__text settings__hint">{t.backup.loadHint}</p>
    </section>
  )
}

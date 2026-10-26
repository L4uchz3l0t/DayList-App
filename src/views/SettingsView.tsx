import { useI18n } from '../i18n/useI18n'
import { LANGUAGE_NAMES, type Language } from '../i18n/messages'
import { DESIGNS, type DesignId } from '../design'
import type { ThemePreference } from '../theme'
import { BackupSettings } from '../components/BackupSettings'
import { CloudSettings } from '../components/CloudSettings'
import { ReminderSettings } from '../components/ReminderSettings'
import { GoogleSettings } from '../components/GoogleSettings'
import type { GoogleCalendarData } from '../google/useGoogleCalendar'
import type { CloudSync } from '../sync/useCloudSync'
import type { MergeResult } from '../storage/backup'
import type { Task } from '../tasks/types'
import './views.css'

interface SettingsViewProps {
  themePreference: ThemePreference
  onThemeChange: (preference: ThemePreference) => void
  design: DesignId
  onDesignChange: (design: DesignId) => void
  tasks: Task[]
  todayKey: string
  onImport: (tasks: Task[]) => MergeResult
  onMessage: (text: string) => void
  cloud: CloudSync
  google: GoogleCalendarData
}

/** Einstellungen: Sprache, Design, Cloud-Sicherung, Erinnerungen, Google Kalender und Datensicherung. */
export function SettingsView({
  themePreference,
  onThemeChange,
  design,
  onDesignChange,
  tasks,
  todayKey,
  onImport,
  onMessage,
  cloud,
  google,
}: SettingsViewProps) {
  const { t, language, setLanguage } = useI18n()
  const themes: { value: ThemePreference; label: string }[] = [
    { value: 'light', label: t.settings.designLight },
    { value: 'dark', label: t.settings.designDark },
    { value: 'system', label: t.settings.designSystem },
  ]

  return (
    <div className="settings">
      <section className="settings__group">
        <h2 className="settings__heading" id="settings-language">
          {t.settings.language}
        </h2>
        <div className="chips" role="radiogroup" aria-labelledby="settings-language">
          {(Object.keys(LANGUAGE_NAMES) as Language[]).map((code) => (
            <button
              key={code}
              type="button"
              role="radio"
              aria-checked={language === code}
              lang={code}
              className="chip settings__chip"
              onClick={() => setLanguage(code)}
            >
              {LANGUAGE_NAMES[code]}
            </button>
          ))}
        </div>
      </section>

      <section className="settings__group">
        <h2 className="settings__heading" id="settings-style">
          {t.settings.style}
        </h2>
        <div className="chips" role="radiogroup" aria-labelledby="settings-style">
          {DESIGNS.map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={design === id}
              className="chip settings__chip"
              onClick={() => onDesignChange(id)}
            >
              {t.settings.styleNames[id]}
            </button>
          ))}
        </div>
      </section>

      <section className="settings__group">
        <h2 className="settings__heading" id="settings-design">
          {t.settings.design}
        </h2>
        <div className="chips" role="radiogroup" aria-labelledby="settings-design">
          {themes.map((theme) => (
            <button
              key={theme.value}
              type="button"
              role="radio"
              aria-checked={themePreference === theme.value}
              className="chip settings__chip"
              onClick={() => onThemeChange(theme.value)}
            >
              {theme.label}
            </button>
          ))}
        </div>
      </section>

      {cloud.available && <CloudSettings cloud={cloud} />}
      {cloud.available && <ReminderSettings signedIn={cloud.email !== null} />}
      {cloud.available && <GoogleSettings google={google} />}

      <BackupSettings tasks={tasks} todayKey={todayKey} onImport={onImport} onMessage={onMessage} />

      <p className="view-intro">{cloud.email ? t.settings.aboutCloud : t.settings.about}</p>
    </div>
  )
}

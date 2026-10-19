import { useI18n } from '../i18n/useI18n'
import { LANGUAGE_NAMES, type Language } from '../i18n/messages'
import type { ThemePreference } from '../theme'
import './views.css'

interface SettingsViewProps {
  themePreference: ThemePreference
  onThemeChange: (preference: ThemePreference) => void
}

/** Einstellungen: Sprache und Design. Weitere (Erinnerungen, Datensicherung) folgen später. */
export function SettingsView({ themePreference, onThemeChange }: SettingsViewProps) {
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

      <p className="view-intro">{t.settings.about}</p>
    </div>
  )
}

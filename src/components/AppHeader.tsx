import type { Theme } from '../theme'
import { Icon } from './Icon'
import './AppHeader.css'
import { useI18n } from '../i18n/useI18n'
import { useNow } from '../useNow'

interface AppHeaderProps {
  title: string
  today: Date
  theme: Theme
  onToggleTheme: () => void
  /** Lupe: öffnet die Suche über alle Aufgaben */
  onSearch: () => void
  /** Zahnrad: öffnet die Einstellungen */
  onSettings: () => void
  settingsOpen: boolean
}

export function AppHeader({ title, today, theme, onToggleTheme, onSearch, onSettings, settingsOpen }: AppHeaderProps) {
  const { t } = useI18n()
  const weekday = today.toLocaleDateString(t.locale, { weekday: 'long' })
  const monthYear = today.toLocaleDateString(t.locale, { month: 'long', year: 'numeric' })
  const now = useNow()

  return (
    <header className="app-header">
      <div className="app-header__top">
        <div className="app-header__date">
          <span className="app-header__day">{today.getDate()}</span>
          <span className="app-header__date-text">
            <span className="app-header__weekday">{weekday}</span>
            <span className="app-header__month">{monthYear}</span>
          </span>
        </div>
        <div className="app-header__actions">
          <button type="button" className="app-header__theme" aria-label={t.header.search} onClick={onSearch}>
            <Icon name="search" size={20} />
          </button>
          <button
            type="button"
            className="app-header__theme"
            aria-label={theme === 'dark' ? t.header.lightOn : t.header.darkOn}
            onClick={onToggleTheme}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
          </button>
          <button
            type="button"
            className="app-header__theme"
            aria-label={t.header.settings}
            aria-pressed={settingsOpen}
            onClick={onSettings}
          >
            <Icon name="settings" size={20} />
          </button>
        </div>
      </div>
      <div className="app-header__bottom">
        <h1 className="app-header__title">{title}</h1>
        {/* Uhr: nur in Designs, die sie zeigen (Fahrplan) */}
        <span className="app-header__clock" aria-hidden="true">
          {now}
        </span>
      </div>
    </header>
  )
}

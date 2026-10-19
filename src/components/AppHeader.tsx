import type { Theme } from '../theme'
import { Icon } from './Icon'
import './AppHeader.css'
import { useI18n } from '../i18n/useI18n'

interface AppHeaderProps {
  title: string
  today: Date
  theme: Theme
  onToggleTheme: () => void
}

export function AppHeader({ title, today, theme, onToggleTheme }: AppHeaderProps) {
  const { t } = useI18n()
  const weekday = today.toLocaleDateString(t.locale, { weekday: 'long' })
  const monthYear = today.toLocaleDateString(t.locale, { month: 'long', year: 'numeric' })

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
        <button
          type="button"
          className="app-header__theme"
          aria-label={theme === 'dark' ? t.header.lightOn : t.header.darkOn}
          onClick={onToggleTheme}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
        </button>
      </div>
      <h1 className="app-header__title">{title}</h1>
    </header>
  )
}

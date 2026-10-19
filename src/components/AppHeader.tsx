import type { Theme } from '../theme'
import { Icon } from './Icon'
import './AppHeader.css'

interface AppHeaderProps {
  title: string
  today: Date
  theme: Theme
  onToggleTheme: () => void
}

export function AppHeader({ title, today, theme, onToggleTheme }: AppHeaderProps) {
  const weekday = today.toLocaleDateString('de-DE', { weekday: 'long' })
  const monthYear = today.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

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
          aria-label={theme === 'dark' ? 'Helles Design einschalten' : 'Dunkles Design einschalten'}
          onClick={onToggleTheme}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
        </button>
      </div>
      <h1 className="app-header__title">{title}</h1>
    </header>
  )
}

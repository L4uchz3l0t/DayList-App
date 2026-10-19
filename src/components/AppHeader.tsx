import { formatLongDate } from '../tasks/dates'
import './AppHeader.css'

interface AppHeaderProps {
  title: string
  today: Date
}

export function AppHeader({ title, today }: AppHeaderProps) {
  return (
    <header className="app-header">
      <p className="app-header__date">{formatLongDate(today)}</p>
      <h1 className="app-header__title">{title}</h1>
    </header>
  )
}

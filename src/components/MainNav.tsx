import { NAV_ITEMS, type ViewId } from '../navigation'
import { Icon } from './Icon'
import './MainNav.css'

interface MainNavProps {
  activeView: ViewId
  onSelect: (view: ViewId) => void
}

/** Hauptnavigation: auf dem Handy unten, auf großen Bildschirmen links. */
export function MainNav({ activeView, onSelect }: MainNavProps) {
  return (
    <nav className="main-nav" aria-label="Hauptnavigation">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className="main-nav__item"
          aria-current={item.id === activeView ? 'page' : undefined}
          onClick={() => onSelect(item.id)}
        >
          <Icon name={item.icon} />
          <span className="main-nav__label main-nav__label--short">{item.shortLabel ?? item.label}</span>
          <span className="main-nav__label main-nav__label--long">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

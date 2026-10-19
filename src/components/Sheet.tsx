import { useEffect, type ReactNode } from 'react'
import { Icon } from './Icon'
import './Sheet.css'
import { useI18n } from '../i18n/useI18n'

interface SheetProps {
  title: string
  onClose: () => void
  children: ReactNode
  /** Das Fenster blendet gerade aus */
  closing?: boolean
}

/**
 * Ein Fenster, das auf dem Handy von unten hereinkommt und am Computer mittig erscheint.
 * Schließt mit Escape, dem X oder einem Tipp daneben.
 */
export function Sheet({ title, onClose, children, closing = false }: SheetProps) {
  const { t } = useI18n()
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div className={`sheet__backdrop${closing ? ' sheet__backdrop--closing' : ''}`} onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet__header">
          <h2 className="sheet__heading">{title}</h2>
          <button type="button" className="sheet__close" aria-label={t.common.close} onClick={onClose}>
            <Icon name="close" size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

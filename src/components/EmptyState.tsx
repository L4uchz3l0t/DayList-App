import './EmptyState.css'

interface EmptyStateProps {
  title: string
  text?: string
  /** Macht die ganze Fläche antippbar, zum Beispiel um eine Aufgabe hinzuzufügen */
  onClick?: () => void
  /** Kleinere Darstellung, zum Beispiel für einen leeren Tag in der Woche */
  compact?: boolean
}

/** Gestrichelte Fläche für leere Listen. */
export function EmptyState({ title, text, onClick, compact = false }: EmptyStateProps) {
  const className = `empty-state${compact ? ' empty-state--compact' : ''}`
  const content = (
    <>
      <span className="empty-state__title">{title}</span>
      {text && <span className="empty-state__text">{text}</span>}
    </>
  )

  return onClick ? (
    <button type="button" className={className} onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  )
}

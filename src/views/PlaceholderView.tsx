interface PlaceholderViewProps {
  text: string
  action?: { label: string; onClick: () => void }
}

/** Hinweistext statt einer Ansicht: für spätere Bereiche, Laden und Fehler. */
export function PlaceholderView({ text, action }: PlaceholderViewProps) {
  return (
    <div>
      <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>{text}</p>
      {action && (
        <button
          type="button"
          className="button button--secondary"
          style={{ marginTop: 'var(--space-4)' }}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

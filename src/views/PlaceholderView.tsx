interface PlaceholderViewProps {
  text: string
}

/** Platzhalter für Bereiche, die in späteren Phasen gebaut werden. */
export function PlaceholderView({ text }: PlaceholderViewProps) {
  return (
    <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>{text}</p>
  )
}

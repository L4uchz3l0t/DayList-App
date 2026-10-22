/** Feste Farben für die Anfangsbuchstaben, damit jede Person immer gleich aussieht */
const COLORS = ['#5b3fd0', '#24855a', '#b5527a', '#3a6ea5', '#a86a00', '#6b6578']

function colorFor(key: string): string {
  let hash = 0
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return COLORS[hash % COLORS.length]
}

interface AvatarProps {
  name: string
  /** Bestimmt die Farbe, zum Beispiel die E-Mail-Adresse */
  colorKey: string
  size?: number
}

/** Runder Anfangsbuchstabe einer Person */
export function Avatar({ name, colorKey, size = 28 }: AvatarProps) {
  return (
    <span
      className="group-avatar"
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 0.43, background: colorFor(colorKey) }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  )
}

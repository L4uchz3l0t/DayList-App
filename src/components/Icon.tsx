/** Kleine, einheitliche Symbole als SVG. So brauchen wir keine zusätzliche Bibliothek. */
const paths = {
  today: 'M12 3v2M12 19v2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M3 12h2M19 12h2M5.6 18.4 7 17M17 7l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  week: 'M4 7h16M4 7v12h16V7M4 7V5h16v2M8 3v4M16 3v4M8 11h2M14 11h2M8 15h2M14 15h2',
  inbox: 'M4 13h4l2 3h4l2-3h4M4 13l2-8h12l2 8v6H4v-6Z',
  all: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM19 12l2-1-1-3-2 .2-1.3-1.3L17 5l-3-1-1 2h-2L10 4 7 5l.3 2L6 8.2 4 8l-1 3 2 1v1l-2 1 1 3 2-.2L7.3 17 7 19l3 1 1-2h2l1 2 3-1-.3-2 1.3-1.3 2 .3 1-3-2-1v-1Z',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12.5 10 17l9-10',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  close: 'M6 6l12 12M18 6 6 18',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z',
  sun: 'M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z',
} as const

export type IconName = keyof typeof paths

interface IconProps {
  name: IconName
  size?: number
}

export function Icon({ name, size = 22 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}

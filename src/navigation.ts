import type { IconName } from './components/Icon'

export type ViewId = 'today' | 'week' | 'inbox' | 'all' | 'settings'

/** Die Bereiche der App, in der Reihenfolge der Navigation. `shortLabel` passt in die schmale Handy-Leiste. */
export const NAV_ITEMS: { id: ViewId; label: string; shortLabel?: string; icon: IconName }[] = [
  { id: 'today', label: 'Heute', icon: 'today' },
  { id: 'week', label: 'Woche', icon: 'week' },
  { id: 'inbox', label: 'Irgendwann', icon: 'coffee' },
  { id: 'all', label: 'Alle', icon: 'all' },
  { id: 'settings', label: 'Einstellungen', shortLabel: 'Optionen', icon: 'settings' },
]

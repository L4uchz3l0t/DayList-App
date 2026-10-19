import type { IconName } from './components/Icon'

export type ViewId = 'today' | 'week' | 'inbox' | 'all' | 'settings'

/** Die Bereiche der App, in der Reihenfolge der Navigation. */
export const NAV_ITEMS: { id: ViewId; label: string; icon: IconName }[] = [
  { id: 'today', label: 'Heute', icon: 'today' },
  { id: 'week', label: 'Woche', icon: 'week' },
  { id: 'inbox', label: 'Eingang', icon: 'inbox' },
  { id: 'all', label: 'Alle', icon: 'all' },
  { id: 'settings', label: 'Einstellungen', icon: 'settings' },
]

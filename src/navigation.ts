import type { IconName } from './components/Icon'
import type { Messages } from './i18n/messages'

export type ViewId = 'today' | 'week' | 'inbox' | 'all' | 'settings'

type NavLabel = Exclude<keyof Messages['nav'], 'label'>

/**
 * Die Bereiche der App, in der Reihenfolge der Navigation.
 * Die Beschriftungen stehen in den Sprachtexten (i18n/messages.ts), `shortLabelKey` passt in die schmale Handy-Leiste.
 */
export const NAV_ITEMS: { id: ViewId; labelKey: NavLabel; shortLabelKey?: NavLabel; icon: IconName }[] = [
  { id: 'today', labelKey: 'today', icon: 'today' },
  { id: 'week', labelKey: 'week', icon: 'week' },
  { id: 'inbox', labelKey: 'someday', icon: 'coffee' },
  { id: 'all', labelKey: 'all', icon: 'all' },
  { id: 'settings', labelKey: 'settings', shortLabelKey: 'settingsShort', icon: 'settings' },
]

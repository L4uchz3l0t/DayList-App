import type { IconName } from './components/Icon'
import type { Messages } from './i18n/messages'

/**
 * 'all' (Suche über alle Aufgaben) und 'settings' stehen nicht in der Leiste,
 * sondern hinter der Lupe und dem Zahnrad oben
 */
export type ViewId = 'today' | 'week' | 'inbox' | 'groups' | 'ai' | 'all' | 'settings'

type NavLabel = Exclude<keyof Messages['nav'], 'label'>

/**
 * Die Bereiche der App, in der Reihenfolge der Navigation.
 * Die Beschriftungen stehen in den Sprachtexten (i18n/messages.ts), `shortLabelKey` passt in die schmale Handy-Leiste.
 */
export const NAV_ITEMS: { id: ViewId; labelKey: NavLabel; shortLabelKey?: NavLabel; icon: IconName }[] = [
  { id: 'today', labelKey: 'today', icon: 'today' },
  { id: 'week', labelKey: 'week', icon: 'week' },
  { id: 'inbox', labelKey: 'someday', icon: 'coffee' },
  { id: 'groups', labelKey: 'groups', icon: 'groups' },
  { id: 'ai', labelKey: 'ai', icon: 'assistant' },
]

import { createContext, useContext } from 'react'
import { de, type Language, type Messages } from './messages'

export interface I18n {
  language: Language
  setLanguage: (language: Language) => void
  /** Die Texte der gewählten Sprache */
  t: Messages
}

export const I18nContext = createContext<I18n>({ language: 'de', setLanguage: () => {}, t: de })

/** Texte und Spracheinstellung für eine Komponente */
export function useI18n(): I18n {
  return useContext(I18nContext)
}

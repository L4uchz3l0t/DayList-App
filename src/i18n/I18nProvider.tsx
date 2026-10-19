import { useEffect, useState, type ReactNode } from 'react'
import { MESSAGES, type Language } from './messages'
import { I18nContext } from './useI18n'

const STORAGE_KEY = 'language'

/** Gespeicherte Sprache, sonst die des Geräts (Deutsch, außer das Gerät ist auf Englisch gestellt) */
function getInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'de' || stored === 'en') return stored
  } catch {
    // Speicher nicht verfügbar: Geräteeinstellung verwenden
  }
  return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'de'
}

/** Stellt die gewählte Sprache allen Komponenten zur Verfügung. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState(getInitialLanguage)

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  function setLanguage(next: Language) {
    setLanguageState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Wahl gilt dann nur bis zum Neuladen
    }
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t: MESSAGES[language] }}>{children}</I18nContext.Provider>
  )
}

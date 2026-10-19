import { useState } from 'react'

/*
  Merkt sich, ob ein Bereich eingeklappt ist, auch nach dem Neuladen.
  Das ist nur eine Bequemlichkeit, deshalb reicht localStorage. Ist er gesperrt, gilt der Standard.
*/

function readStored(key: string): boolean | null {
  try {
    const value = localStorage.getItem(`collapsed:${key}`)
    return value === null ? null : value === 'true'
  } catch {
    return null
  }
}

export function useCollapsed(key: string, defaultCollapsed: boolean): [boolean, () => void] {
  const [collapsed, setCollapsed] = useState(() => readStored(key) ?? defaultCollapsed)

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    try {
      localStorage.setItem(`collapsed:${key}`, String(next))
    } catch {
      // Nicht speicherbar: gilt dann nur bis zum Neuladen
    }
  }

  return [collapsed, toggle]
}

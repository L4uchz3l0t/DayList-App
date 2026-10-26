import { useEffect, useState } from 'react'

const pad = (value: number) => String(value).padStart(2, '0')
const currentTime = () => {
  const now = new Date()
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`
}

/** Aktuelle Uhrzeit als "HH:MM", wird jede halbe Minute aufgefrischt */
export function useNow(): string {
  const [time, setTime] = useState(currentTime)
  useEffect(() => {
    const timer = window.setInterval(() => setTime(currentTime()), 30_000)
    return () => window.clearInterval(timer)
  }, [])
  return time
}

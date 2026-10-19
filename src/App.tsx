import { useCallback, useState } from 'react'
import { AddButton } from './components/AddButton'
import { AppHeader } from './components/AppHeader'
import { MainNav } from './components/MainNav'
import { QuickAdd, type QuickAddTarget } from './components/QuickAdd'
import { NAV_ITEMS, type ViewId } from './navigation'
import { createId } from './tasks/createId'
import { addDays, toDateKey } from './tasks/dates'
import { createSampleTasks } from './tasks/sampleTasks'
import type { Task } from './tasks/types'
import { applyTheme, getInitialTheme, type Theme } from './theme'
import { PlaceholderView } from './views/PlaceholderView'
import { TodayView } from './views/TodayView'
import './App.css'

function App() {
  // Phase 2: Die Aufgaben leben nur im Arbeitsspeicher und sind nach dem Neuladen wieder die Beispieldaten.
  const [today] = useState(() => new Date())
  const [tasks, setTasks] = useState<Task[]>(() => createSampleTasks(today))
  const [activeView, setActiveView] = useState<ViewId>('today')
  const [isQuickAddOpen, setQuickAddOpen] = useState(false)
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  const todayKey = toDateKey(today)
  const closeQuickAdd = useCallback(() => setQuickAddOpen(false), [])

  function toggleTask(id: string) {
    const now = new Date().toISOString()
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, status: task.status === 'done' ? 'open' : 'done', updatedAt: now } : task,
      ),
    )
  }

  function addTask(title: string, target: QuickAddTarget) {
    const now = new Date().toISOString()
    const plannedDate =
      target === 'today' ? todayKey : target === 'tomorrow' ? toDateKey(addDays(today, 1)) : undefined
    setTasks((current) => [
      ...current,
      { id: createId(), title, status: 'open', plannedDate, createdAt: now, updatedAt: now },
    ])
  }

  const viewTitle = NAV_ITEMS.find((item) => item.id === activeView)?.label ?? ''

  return (
    <div className="app">
      <MainNav activeView={activeView} onSelect={setActiveView} />

      <main className="app__main">
        <AppHeader title={viewTitle} today={today} theme={theme} onToggleTheme={toggleTheme} />
        {activeView === 'today' ? (
          <TodayView tasks={tasks} todayKey={todayKey} onToggle={toggleTask} />
        ) : (
          <PlaceholderView text="Dieser Bereich kommt in einer späteren Phase." />
        )}
      </main>

      <AddButton onClick={() => setQuickAddOpen(true)} />
      {isQuickAddOpen && <QuickAdd onSave={addTask} onClose={closeQuickAdd} />}
    </div>
  )
}

export default App

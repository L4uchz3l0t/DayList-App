import { useCallback, useState } from 'react'
import { AddButton } from './components/AddButton'
import { AppHeader } from './components/AppHeader'
import { MainNav } from './components/MainNav'
import { QuickAdd } from './components/QuickAdd'
import { TaskDetail } from './components/TaskDetail'
import { Toast, type ToastMessage } from './components/Toast'
import { NAV_ITEMS, type ViewId } from './navigation'
import { formatShortDate, toDateKey } from './tasks/dates'
import type { TaskChanges } from './tasks/taskOperations'
import { useTasks } from './tasks/useTasks'
import { applyTheme, getInitialTheme, type Theme } from './theme'
import { PlaceholderView } from './views/PlaceholderView'
import { TodayView } from './views/TodayView'
import './App.css'

function App() {
  const [today] = useState(() => new Date())
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const showSaveError = useCallback(() => {
    setToast({ id: Date.now(), text: 'Speichern fehlgeschlagen. Bitte lade die Seite neu.' })
  }, [])
  const { tasks, status, reload, addTask, editTask, toggleTask, removeTask, undoRemove } = useTasks(showSaveError)
  const [activeView, setActiveView] = useState<ViewId>('today')
  const [isQuickAddOpen, setQuickAddOpen] = useState(false)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  const todayKey = toDateKey(today)
  const openTask = tasks.find((task) => task.id === openTaskId)

  const closeQuickAdd = useCallback(() => setQuickAddOpen(false), [])
  const closeDetail = useCallback(() => setOpenTaskId(null), [])
  const dismissToast = useCallback(() => setToast(null), [])

  function showToast(text: string, action?: ToastMessage['action']) {
    setToast({ id: Date.now(), text, action })
  }

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  function handleSaveDetail(id: string, changes: TaskChanges) {
    const before = tasks.find((task) => task.id === id)
    editTask(id, changes)
    setOpenTaskId(null)

    // Rückmeldung, besonders wenn die Aufgabe aus der Heute-Ansicht verschwindet
    if (before && before.plannedDate !== changes.plannedDate) {
      showToast(
        changes.plannedDate === undefined
          ? 'In den Eingang verschoben'
          : changes.plannedDate === todayKey
            ? 'Für heute eingeplant'
            : `Verschoben auf ${formatShortDate(changes.plannedDate)}`,
      )
    } else {
      showToast('Gespeichert')
    }
  }

  function handleDelete(id: string) {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    removeTask(id)
    setOpenTaskId(null)
    showToast(`„${task.title}“ gelöscht`, { label: 'Rückgängig', onClick: () => undoRemove(task) })
  }

  const viewTitle = NAV_ITEMS.find((item) => item.id === activeView)?.label ?? ''

  return (
    <div className="app">
      <MainNav activeView={activeView} onSelect={setActiveView} />

      <main className="app__main">
        <AppHeader title={viewTitle} today={today} theme={theme} onToggleTheme={toggleTheme} />
        {status === 'loading' ? (
          <PlaceholderView text="Aufgaben werden geladen …" />
        ) : status === 'error' ? (
          <PlaceholderView
            text="Deine Aufgaben konnten nicht geladen werden. Im privaten Modus mancher Browser ist das Speichern gesperrt."
            action={{ label: 'Erneut versuchen', onClick: reload }}
          />
        ) : activeView === 'today' ? (
          <TodayView tasks={tasks} todayKey={todayKey} onToggle={toggleTask} onOpen={setOpenTaskId} />
        ) : (
          <PlaceholderView text="Dieser Bereich kommt in einer späteren Phase." />
        )}
      </main>

      {status === 'ready' && <AddButton onClick={() => setQuickAddOpen(true)} />}
      {isQuickAddOpen && <QuickAdd todayKey={todayKey} onSave={addTask} onClose={closeQuickAdd} />}
      {openTask && (
        <TaskDetail
          key={openTask.id}
          task={openTask}
          todayKey={todayKey}
          onSave={(changes) => handleSaveDetail(openTask.id, changes)}
          onToggle={() => {
            toggleTask(openTask.id)
            setOpenTaskId(null)
          }}
          onDelete={() => handleDelete(openTask.id)}
          onClose={closeDetail}
        />
      )}
      {toast && <Toast key={toast.id} message={toast} onDismiss={dismissToast} />}
    </div>
  )
}

export default App

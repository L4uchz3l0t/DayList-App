import { useCallback, useState } from 'react'
import { AddButton } from './components/AddButton'
import { AppHeader } from './components/AppHeader'
import { MainNav } from './components/MainNav'
import { MoveSheet } from './components/MoveSheet'
import { QuickAdd } from './components/QuickAdd'
import { TaskDetail } from './components/TaskDetail'
import { Toast, type ToastMessage } from './components/Toast'
import { NAV_ITEMS, type ViewId } from './navigation'
import { formatWeekdayDate, toDateKey } from './tasks/dates'
import type { TaskChanges } from './tasks/taskOperations'
import { useTasks } from './tasks/useTasks'
import { applyTheme, getInitialTheme, type Theme } from './theme'
import { useToday } from './useToday'
import { AllView } from './views/AllView'
import { InboxView } from './views/InboxView'
import { PlaceholderView } from './views/PlaceholderView'
import { TodayView } from './views/TodayView'
import { WeekView } from './views/WeekView'
import './App.css'

/** Rückmeldung nach dem Verschieben, besonders wenn die Aufgabe aus der aktuellen Ansicht verschwindet */
function describeMove(plannedDate: string | undefined, todayKey: string): string {
  if (plannedDate === undefined) return 'In den Eingang verschoben'
  if (plannedDate === todayKey) return 'Für heute eingeplant'
  return `Verschoben auf ${formatWeekdayDate(plannedDate)}`
}

function App() {
  const today = useToday()
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const showSaveError = useCallback(() => {
    setToast({ id: Date.now(), text: 'Speichern fehlgeschlagen. Bitte lade die Seite neu.' })
  }, [])
  const { tasks, status, reload, addTask, editTask, toggleTask, removeTask, undoRemove } = useTasks(showSaveError)
  const [activeView, setActiveView] = useState<ViewId>('today')
  /** Vorgewählter Tag der offenen Schnellaufnahme ('' = Eingang), null = geschlossen */
  const [quickAddDay, setQuickAddDay] = useState<string | null>(null)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)
  const [moveTaskId, setMoveTaskId] = useState<string | null>(null)
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  const todayKey = toDateKey(today)
  const openTask = tasks.find((task) => task.id === openTaskId)
  const moveTask = tasks.find((task) => task.id === moveTaskId)

  const closeQuickAdd = useCallback(() => setQuickAddDay(null), [])
  const closeDetail = useCallback(() => setOpenTaskId(null), [])
  const closeMove = useCallback(() => setMoveTaskId(null), [])
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
    showToast(before && before.plannedDate !== changes.plannedDate ? describeMove(changes.plannedDate, todayKey) : 'Gespeichert')
  }

  function handleMove(id: string, plannedDate: string) {
    const before = tasks.find((task) => task.id === id)
    setMoveTaskId(null)
    if (!before || (before.plannedDate ?? '') === plannedDate) return
    editTask(id, { plannedDate: plannedDate || undefined })
    showToast(describeMove(plannedDate || undefined, todayKey), {
      label: 'Rückgängig',
      onClick: () => editTask(id, { plannedDate: before.plannedDate }),
    })
  }

  function handleDelete(id: string) {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    removeTask(id)
    setOpenTaskId(null)
    showToast(`„${task.title}“ gelöscht`, { label: 'Rückgängig', onClick: () => undoRemove(task) })
  }

  const viewTitle = NAV_ITEMS.find((item) => item.id === activeView)?.label ?? ''
  const viewProps = { tasks, todayKey, onToggle: toggleTask, onOpen: setOpenTaskId, onMove: setMoveTaskId }

  function renderView() {
    switch (activeView) {
      case 'today':
        return <TodayView {...viewProps} onAdd={() => setQuickAddDay(todayKey)} />
      case 'week':
        return <WeekView {...viewProps} onAdd={setQuickAddDay} />
      case 'inbox':
        return <InboxView {...viewProps} onAdd={() => setQuickAddDay('')} />
      case 'all':
        return <AllView {...viewProps} onAdd={() => setQuickAddDay('')} />
      case 'settings':
        return <PlaceholderView text="Die Einstellungen kommen in einer späteren Phase." />
    }
  }

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
        ) : (
          renderView()
        )}
      </main>

      {status === 'ready' && <AddButton onClick={() => setQuickAddDay('')} />}
      {quickAddDay !== null && (
        <QuickAdd todayKey={todayKey} initialPlannedDate={quickAddDay} onSave={addTask} onClose={closeQuickAdd} />
      )}
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
      {moveTask && (
        <MoveSheet
          key={moveTask.id}
          task={moveTask}
          todayKey={todayKey}
          onMove={(plannedDate) => handleMove(moveTask.id, plannedDate)}
          onClose={closeMove}
        />
      )}
      {toast && <Toast key={toast.id} message={toast} onDismiss={dismissToast} />}
    </div>
  )
}

export default App

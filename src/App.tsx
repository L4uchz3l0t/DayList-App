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
import { useI18n } from './i18n/useI18n'
import type { Messages } from './i18n/messages'
import type { TaskChanges } from './tasks/taskOperations'
import { useTasks } from './tasks/useTasks'
import { applyThemePreference, getThemePreference, resolveTheme, type ThemePreference } from './theme'
import { useToday } from './useToday'
import { AllView } from './views/AllView'
import { InboxView } from './views/InboxView'
import { PlaceholderView } from './views/PlaceholderView'
import { SettingsView } from './views/SettingsView'
import { TodayView } from './views/TodayView'
import { WeekView } from './views/WeekView'
import './App.css'

/** Rückmeldung nach dem Verschieben, besonders wenn die Aufgabe aus der aktuellen Ansicht verschwindet */
function describeMove(plannedDate: string | undefined, todayKey: string, t: Messages): string {
  if (plannedDate === undefined) return t.toast.toSomeday
  if (plannedDate === todayKey) return t.toast.toToday
  return t.toast.movedTo(formatWeekdayDate(plannedDate, t.locale))
}

function App() {
  const today = useToday()
  const { t } = useI18n()
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const showSaveError = useCallback(() => {
    setToast({ id: Date.now(), text: t.status.saveError })
  }, [t])
  const { tasks, status, reload, addTask, editTask, toggleTask, removeTask, undoRemove } = useTasks(showSaveError)
  const [activeView, setActiveView] = useState<ViewId>('today')
  /** Vorgewählter Tag der offenen Schnellaufnahme ('' = Irgendwann), null = geschlossen */
  const [quickAddDay, setQuickAddDay] = useState<string | null>(null)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)
  const [moveTaskId, setMoveTaskId] = useState<string | null>(null)
  const [themePreference, setThemePreference] = useState<ThemePreference>(getThemePreference)
  const theme = resolveTheme(themePreference)

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

  function changeTheme(preference: ThemePreference) {
    applyThemePreference(preference)
    setThemePreference(preference)
  }

  function handleSaveDetail(id: string, changes: TaskChanges) {
    const before = tasks.find((task) => task.id === id)
    editTask(id, changes)
    setOpenTaskId(null)
    showToast(before && before.plannedDate !== changes.plannedDate ? describeMove(changes.plannedDate, todayKey, t) : t.toast.saved)
  }

  function handleMove(id: string, plannedDate: string) {
    const before = tasks.find((task) => task.id === id)
    setMoveTaskId(null)
    if (!before || (before.plannedDate ?? '') === plannedDate) return
    editTask(id, { plannedDate: plannedDate || undefined })
    showToast(describeMove(plannedDate || undefined, todayKey, t), {
      label: t.common.undo,
      onClick: () => editTask(id, { plannedDate: before.plannedDate }),
    })
  }

  function handleDelete(id: string) {
    const task = tasks.find((candidate) => candidate.id === id)
    if (!task) return
    removeTask(id)
    setOpenTaskId(null)
    showToast(t.toast.deleted(task.title), { label: t.common.undo, onClick: () => undoRemove(task) })
  }

  const navItem = NAV_ITEMS.find((item) => item.id === activeView)
  const viewTitle = navItem ? t.nav[navItem.labelKey] : ''
  const viewProps = { tasks, todayKey, onToggle: toggleTask, onOpen: setOpenTaskId, onMove: setMoveTaskId }

  function renderView() {
    switch (activeView) {
      case 'today':
        return <TodayView {...viewProps} onAdd={() => setQuickAddDay(todayKey)} />
      case 'week':
        return <WeekView {...viewProps} onMoveTo={handleMove} onAdd={setQuickAddDay} />
      case 'inbox':
        return <InboxView {...viewProps} onAdd={() => setQuickAddDay('')} />
      case 'all':
        return <AllView {...viewProps} onAdd={() => setQuickAddDay('')} />
      case 'settings':
        return <SettingsView themePreference={themePreference} onThemeChange={changeTheme} />
    }
  }

  return (
    <div className="app">
      <MainNav activeView={activeView} onSelect={setActiveView} />

      <main className="app__main">
        <AppHeader title={viewTitle} today={today} theme={theme} onToggleTheme={() => changeTheme(theme === 'dark' ? 'light' : 'dark')} />
        {status === 'loading' ? (
          <PlaceholderView text={t.status.loading} />
        ) : status === 'error' ? (
          <PlaceholderView
            text={t.status.loadError}
            action={{ label: t.common.retry, onClick: reload }}
          />
        ) : (
          renderView()
        )}
      </main>

      {status === 'ready' && <AddButton onClick={() => setQuickAddDay(activeView === 'today' ? todayKey : '')} />}
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

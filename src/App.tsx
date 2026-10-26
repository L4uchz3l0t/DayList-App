import { useCallback, useEffect, useMemo, useState } from 'react'
import { AddButton } from './components/AddButton'
import { AppHeader } from './components/AppHeader'
import { MainNav } from './components/MainNav'
import { MoveSheet } from './components/MoveSheet'
import { QuickAdd } from './components/QuickAdd'
import { TaskDetail } from './components/TaskDetail'
import { Toast, type ToastMessage } from './components/Toast'
import { usePresence } from './usePresence'
import { useSwipe } from './components/useSwipe'
import { useCloudSync } from './sync/useCloudSync'
import { NAV_ITEMS, type ViewId } from './navigation'
import { formatWeekdayDate, toDateKey } from './tasks/dates'
import { useI18n } from './i18n/useI18n'
import type { Messages } from './i18n/messages'
import type { TaskChanges } from './tasks/taskOperations'
import { useTasks } from './tasks/useTasks'
import { applyThemePreference, getThemePreference, resolveTheme, type ThemePreference } from './theme'
import { useToday } from './useToday'
import { AiView } from './views/AiView'
import { AllView } from './views/AllView'
import { InboxView } from './views/InboxView'
import { PlaceholderView } from './views/PlaceholderView'
import { SettingsView } from './views/SettingsView'
import { TodayView } from './views/TodayView'
import { CalendarView } from './views/CalendarView'
import { GroupsView } from './groups/components/GroupsView'
import { setGroupTaskDone } from './groups/groupStore'
import { fromCalendarId, isGroupTaskId, toCalendarTasks } from './groups/groupViews'
import { describeGroupError } from './groups/components/groupErrors'
import { useGroups } from './groups/useGroups'
import { isGoogleEventId } from './google/googleCalendar'
import { useGoogleCalendar } from './google/useGoogleCalendar'
import './App.css'

/** Rückmeldung nach dem Verschieben, besonders wenn die Aufgabe aus der aktuellen Ansicht verschwindet */
function describeMove(plannedDate: string | undefined, todayKey: string, t: Messages): string {
  if (plannedDate === undefined) return t.toast.toSomeday
  if (plannedDate === todayKey) return t.toast.toToday
  return t.toast.movedTo(formatWeekdayDate(plannedDate, t.locale))
}

function App() {
  const today = useToday()
  const todayKey = toDateKey(today)
  const { t } = useI18n()
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const showSaveError = useCallback(() => {
    setToast({ id: Date.now(), text: t.status.saveError })
  }, [t])
  const {
    tasks,
    status,
    reload,
    addTask,
    editTask,
    toggleTask,
    removeTask,
    undoRemove,
    importTasks,
    getTasks,
    applySync,
  } = useTasks(showSaveError)
  const cloud = useCloudSync(tasks, status === 'ready', getTasks, applySync)
  const groups = useGroups(cloud.email)
  const google = useGoogleCalendar(cloud.email, todayKey)
  // Nach der Anmeldung bei Google kommt die App mit ?google=connected (oder =error/=denied) zurück
  const [googleReturn] = useState(() => new URLSearchParams(window.location.search).get('google'))
  const [activeView, setActiveView] = useState<ViewId>(googleReturn ? 'settings' : 'today')
  const [openGroupId, setOpenGroupId] = useState<string | null>(null)
  /** Vorgewählter Tag der offenen Schnellaufnahme ('' = Irgendwann), null = geschlossen */
  const [quickAddDay, setQuickAddDay] = useState<string | null>(null)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)
  const [moveTaskId, setMoveTaskId] = useState<string | null>(null)
  const [themePreference, setThemePreference] = useState<ThemePreference>(getThemePreference)
  const theme = resolveTheme(themePreference)

  const openTask = tasks.find((task) => task.id === openTaskId)
  const moveTask = tasks.find((task) => task.id === moveTaskId)
  // Geschlossene Fenster und Meldungen bleiben kurz zum Ausblenden sichtbar
  const quickAdd = usePresence(quickAddDay)
  const detail = usePresence(openTask ?? null)
  const move = usePresence(moveTask ?? null)
  const toastPresence = usePresence(toast)
  const detailTask = detail.shown
  const moveSheetTask = move.shown

  const closeQuickAdd = useCallback(() => setQuickAddDay(null), [])
  const closeDetail = useCallback(() => setOpenTaskId(null), [])
  const closeMove = useCallback(() => setMoveTaskId(null), [])
  const dismissToast = useCallback(() => setToast(null), [])

  function showToast(text: string, action?: ToastMessage['action']) {
    setToast({ id: Date.now(), text, action })
  }

  // Rückkehr von Google: Meldung zeigen und den Zusatz aus der Adresse entfernen
  useEffect(() => {
    if (!googleReturn) return
    const url = new URL(window.location.href)
    url.searchParams.delete('google')
    window.history.replaceState(null, '', url)
    setToast({ id: Date.now(), text: googleReturn === 'connected' ? t.google.connected : t.google.error })
    // Nur einmal beim Start
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function changeTheme(preference: ThemePreference) {
    applyThemePreference(preference)
    setThemePreference(preference)
  }

  function handleSaveDetail(id: string, changes: TaskChanges) {
    const before = tasks.find((task) => task.id === id)
    editTask(id, changes)
    setOpenTaskId(null)
    showToast(
      before && before.plannedDate !== changes.plannedDate
        ? describeMove(changes.plannedDate, todayKey, t)
        : t.toast.saved,
    )
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

  // Eigene Gruppenaufgaben erscheinen zusätzlich unter Heute und im Kalender (nur angezeigt, nicht auf dem Gerät gespeichert)
  const groupCalendarTasks = useMemo(() => toCalendarTasks(groups.groups, groups.email), [groups.groups, groups.email])
  // Dazu die Termine aus dem Google Kalender (ebenfalls nur angezeigt)
  const tasksWithGroups = useMemo(
    () => [...tasks, ...groupCalendarTasks, ...google.events],
    [tasks, groupCalendarTasks, google.events],
  )

  function handleToggle(id: string) {
    if (isGoogleEventId(id)) return
    if (!isGroupTaskId(id)) {
      toggleTask(id)
      return
    }
    const task = groupCalendarTasks.find((candidate) => candidate.id === id)
    if (!task) return
    groups
      .run(() => setGroupTaskDone(fromCalendarId(id), task.status === 'open'))
      .catch((error: unknown) => {
        console.error('Gruppenaufgabe abhaken fehlgeschlagen', error)
        showToast(describeGroupError(error, t))
      })
  }

  /** Gruppenaufgaben öffnen sich in ihrer Gruppe, Google-Termine in Google Kalender, alle anderen im Detailfenster */
  function handleOpen(id: string) {
    if (isGoogleEventId(id)) {
      const event = google.events.find((candidate) => candidate.id === id)
      if (event?.google) window.open(event.google.link, '_blank', 'noopener')
      return
    }
    if (!isGroupTaskId(id)) {
      setOpenTaskId(id)
      return
    }
    const task = groupCalendarTasks.find((candidate) => candidate.id === id)
    if (!task?.group) return
    setOpenGroupId(task.group.id)
    setActiveView('groups')
  }

  // Richtung des letzten Tab-Wechsels per Wischen, damit die neue Ansicht von der passenden Seite kommt
  const [viewDirection, setViewDirection] = useState<'next' | 'previous' | null>(null)

  function selectView(view: ViewId) {
    if (view === 'groups') setOpenGroupId(null)
    setViewDirection(null)
    setActiveView(view)
  }

  /** Nächster oder vorheriger Tab in der Reihenfolge der Navigation */
  function swipeView(step: number) {
    const index = NAV_ITEMS.findIndex((item) => item.id === activeView)
    const next = NAV_ITEMS[index + step]
    if (index === -1 || !next) return
    if (next.id === 'groups') setOpenGroupId(null)
    setViewDirection(step > 0 ? 'next' : 'previous')
    setActiveView(next.id)
  }

  // Seitliches Wischen wechselt den Tab. Im Kalender wechselt Wischen innen Monat und Tag,
  // dort zählt für den Tab nur Wischen, das am Bildschirmrand beginnt.
  const viewSwipe = useSwipe(
    () => swipeView(1),
    () => swipeView(-1),
    quickAddDay !== null || openTaskId !== null || moveTaskId !== null,
    activeView === 'week' ? 'edge' : 'any',
  )

  const navItem = NAV_ITEMS.find((item) => item.id === activeView)
  const viewTitle =
    activeView === 'all' ? t.nav.all : activeView === 'settings' ? t.nav.settings : navItem ? t.nav[navItem.labelKey] : ''
  const viewProps = { tasks, todayKey, onToggle: toggleTask, onOpen: setOpenTaskId, onMove: setMoveTaskId }
  const calendarProps = { ...viewProps, tasks: tasksWithGroups, onToggle: handleToggle, onOpen: handleOpen }

  function renderView() {
    switch (activeView) {
      case 'today':
        return <TodayView {...calendarProps} onAdd={() => setQuickAddDay(todayKey)} />
      case 'week':
        return <CalendarView {...calendarProps} onMoveTo={handleMove} onAdd={setQuickAddDay} />
      case 'inbox':
        return <InboxView {...viewProps} onAdd={() => setQuickAddDay('')} />
      case 'all':
        return <AllView {...viewProps} onAdd={() => setQuickAddDay('')} />
      case 'groups':
        return (
          <GroupsView
            data={groups}
            todayKey={todayKey}
            openGroupId={openGroupId}
            onOpenGroup={setOpenGroupId}
            onMessage={showToast}
            onGoToSettings={() => setActiveView('settings')}
          />
        )
      case 'ai':
        return (
          <AiView
            tasks={tasksWithGroups}
            todayKey={todayKey}
            signedIn={cloud.email !== null}
            onAdd={addTask}
            onMessage={showToast}
          />
        )
      case 'settings':
        return (
          <SettingsView
            themePreference={themePreference}
            onThemeChange={changeTheme}
            tasks={tasks}
            todayKey={todayKey}
            onImport={importTasks}
            onMessage={showToast}
            cloud={cloud}
            google={google}
          />
        )
    }
  }

  return (
    <div className="app">
      <MainNav activeView={activeView} onSelect={selectView} />

      <main className="app__main" {...viewSwipe}>
        <AppHeader
          title={viewTitle}
          today={today}
          theme={theme}
          onToggleTheme={() => changeTheme(theme === 'dark' ? 'light' : 'dark')}
          onSearch={() => setActiveView('all')}
          onSettings={() => selectView(activeView === 'settings' ? 'today' : 'settings')}
          settingsOpen={activeView === 'settings'}
        />
        {status === 'loading' ? (
          <PlaceholderView text={t.status.loading} />
        ) : status === 'error' ? (
          <PlaceholderView text={t.status.loadError} action={{ label: t.common.retry, onClick: reload }} />
        ) : (
          // Neuer Schlüssel pro Ansicht: beim Wechsel blendet die Ansicht sanft ein
          <div key={activeView} className={viewDirection ? `view-enter view-enter--${viewDirection}` : 'view-enter'}>
            {renderView()}
          </div>
        )}
      </main>

      {/* In Gruppen hat der Plus-Knopf eine eigene Aufgabe (neue Gruppe, Aufgabe zuteilen) */}
      {status === 'ready' && activeView !== 'groups' && activeView !== 'ai' && activeView !== 'settings' && (
        <AddButton onClick={() => setQuickAddDay(activeView === 'today' ? todayKey : '')} />
      )}
      {quickAdd.shown !== null && (
        <QuickAdd
          todayKey={todayKey}
          initialPlannedDate={quickAdd.shown}
          onSave={addTask}
          onClose={closeQuickAdd}
          closeAfterSave={activeView === 'today'}
          onSaved={showToast}
          closing={quickAdd.closing}
        />
      )}
      {detailTask && (
        <TaskDetail
          key={detailTask.id}
          task={detailTask}
          todayKey={todayKey}
          onSave={(changes) => handleSaveDetail(detailTask.id, changes)}
          onToggle={() => {
            toggleTask(detailTask.id)
            setOpenTaskId(null)
          }}
          onDelete={() => handleDelete(detailTask.id)}
          onClose={closeDetail}
          closing={detail.closing}
        />
      )}
      {moveSheetTask && (
        <MoveSheet
          key={moveSheetTask.id}
          task={moveSheetTask}
          todayKey={todayKey}
          onMove={(plannedDate) => handleMove(moveSheetTask.id, plannedDate)}
          onClose={closeMove}
          closing={move.closing}
        />
      )}
      {toastPresence.shown && (
        <Toast
          key={toastPresence.shown.id}
          message={toastPresence.shown}
          onDismiss={dismissToast}
          closing={toastPresence.closing}
        />
      )}
    </div>
  )
}

export default App

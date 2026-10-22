import { useState } from 'react'
import { AddButton } from '../../components/AddButton'
import { Icon } from '../../components/Icon'
import { useI18n } from '../../i18n/useI18n'
import { usePresence } from '../../usePresence'
import { setGroupTaskDone, setShowInCalendar } from '../groupStore'
import { findMember, isAdmin, nameOf, tasksFor, tasksOfOthers } from '../groupViews'
import type { Group, GroupTask } from '../types'
import { Avatar } from './Avatar'
import { GroupManageSheet } from './GroupManageSheet'
import { GroupTaskRow } from './GroupTaskRow'
import { GroupTaskSheet } from './GroupTaskSheet'

interface GroupDetailProps {
  group: Group
  myEmail: string
  todayKey: string
  act: (action: () => Promise<unknown>, success?: string) => Promise<boolean>
  onBack: () => void
}

/** Eine geöffnete Gruppe: oben "Für dich", darunter "Die anderen" nach Person */
export function GroupDetail({ group, myEmail, todayKey, act, onBack }: GroupDetailProps) {
  const { t } = useI18n()
  const admin = isAdmin(group, myEmail)
  const me = findMember(group, myEmail)
  const mine = tasksFor(group, myEmail, todayKey)
  const others = tasksOfOthers(group, myEmail, todayKey)

  // Fenster: neue Aufgabe ('new'), Aufgabe bearbeiten, Verwalten
  const [editing, setEditing] = useState<GroupTask | 'new' | null>(null)
  const [managing, setManaging] = useState(false)
  // Der Schalter springt sofort um, auch wenn die Cloud noch antwortet
  const [calendarSwitch, setCalendarSwitch] = useState<boolean | null>(null)
  const taskSheet = usePresence(editing)
  const manageSheet = usePresence(managing ? group : null)

  const toggle = (task: GroupTask) => void act(() => setGroupTaskDone(task.id, task.done_at === null))
  const edit = admin ? (task: GroupTask) => () => setEditing(task) : () => undefined

  return (
    <div className="group-detail">
      <div className="group-detail__head">
        <button type="button" className="group-detail__back" aria-label={t.groups.back} onClick={onBack}>
          <Icon name="chevronLeft" size={24} />
        </button>
        <div className="group-detail__title">
          <h2 className="group-detail__name">{group.name}</h2>
          <span className="group-detail__sub">{t.groups.members(group.members.length)}</span>
        </div>
        <button
          type="button"
          className="app-header__theme"
          aria-label={t.groups.manage}
          onClick={() => setManaging(true)}
        >
          <Icon name="more" size={22} />
        </button>
      </div>

      <section className="task-section task-section--accent">
        <h3 className="task-section__title">
          <span className="task-section__dot" aria-hidden="true" />
          {t.groups.forYou} <span className="task-section__count">{mine.filter((task) => !task.done_at).length}</span>
        </h3>
        {mine.length === 0 ? (
          <p className="group-detail__empty">{t.groups.nothingForYou}</p>
        ) : (
          <ul className="group-task-list">
            {mine.map((task) => (
              <GroupTaskRow
                key={task.id}
                task={task}
                assigneeName={me?.display_name ?? ''}
                todayKey={todayKey}
                canToggle
                onToggle={() => toggle(task)}
                onEdit={admin ? edit(task) : undefined}
              />
            ))}
          </ul>
        )}
        {me && (
          <label className="group-switch">
            <span>{t.groups.showInCalendar}</span>
            <input
              type="checkbox"
              role="switch"
              className="group-switch__input"
              checked={calendarSwitch ?? me.show_in_calendar}
              onChange={(event) => {
                const show = event.target.checked
                setCalendarSwitch(show)
                void act(() => setShowInCalendar(group.id, show)).finally(() => setCalendarSwitch(null))
              }}
            />
          </label>
        )}
      </section>

      {others.length > 0 && (
        <section className="task-section">
          <h3 className="task-section__title group-detail__others-title">
            <span className="task-section__dot" aria-hidden="true" />
            {t.groups.others}
          </h3>
          <div className="group-people">
            {others.map((person) => (
              <div key={person.email} className="group-person">
                <div className="group-person__head">
                  <Avatar name={person.name} colorKey={person.email} />
                  <span className="group-person__name">{person.name}</span>
                </div>
                {person.tasks.length === 0 ? (
                  <p className="group-person__empty">{t.groups.nothingForPerson}</p>
                ) : (
                  <ul className="group-task-list">
                    {person.tasks.map((task) => (
                      <GroupTaskRow
                        key={task.id}
                        task={task}
                        assigneeName={nameOf(group, task.assignee)}
                        todayKey={todayKey}
                        canToggle={admin}
                        onToggle={() => toggle(task)}
                        onEdit={admin ? edit(task) : undefined}
                        compact
                      />
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {admin && <AddButton label={t.groups.assign} onClick={() => setEditing('new')} />}

      {taskSheet.shown !== null && (
        <GroupTaskSheet
          key={taskSheet.shown === 'new' ? 'new' : taskSheet.shown.id}
          group={group}
          task={taskSheet.shown === 'new' ? null : taskSheet.shown}
          defaultAssignee={myEmail}
          todayKey={todayKey}
          act={act}
          onClose={() => setEditing(null)}
          closing={taskSheet.closing}
        />
      )}
      {manageSheet.shown && (
        <GroupManageSheet
          group={group}
          myEmail={myEmail}
          act={act}
          onGone={() => {
            setManaging(false)
            onBack()
          }}
          onClose={() => setManaging(false)}
          closing={manageSheet.closing}
        />
      )}
    </div>
  )
}

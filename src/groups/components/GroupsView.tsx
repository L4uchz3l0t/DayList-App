import { useCallback, useState } from 'react'
import { AddButton } from '../../components/AddButton'
import { EmptyState } from '../../components/EmptyState'
import { Icon } from '../../components/Icon'
import { useI18n } from '../../i18n/useI18n'
import { usePresence } from '../../usePresence'
import { PlaceholderView } from '../../views/PlaceholderView'
import { createGroup } from '../groupStore'
import { isAdmin, openCountFor } from '../groupViews'
import type { GroupsData } from '../useGroups'
import { Avatar } from './Avatar'
import { describeGroupError } from './groupErrors'
import { GroupDetail } from './GroupDetail'
import { NewGroupSheet } from './NewGroupSheet'
import './groups.css'

interface GroupsViewProps {
  data: GroupsData
  todayKey: string
  /** Geöffnete Gruppe, null = Übersicht */
  openGroupId: string | null
  onOpenGroup: (groupId: string | null) => void
  onMessage: (text: string) => void
  onGoToSettings: () => void
}

/** Der Bereich "Gruppen": Übersicht aller Gruppen oder eine geöffnete Gruppe */
export function GroupsView({ data, todayKey, openGroupId, onOpenGroup, onMessage, onGoToSettings }: GroupsViewProps) {
  const { t } = useI18n()
  const { status, groups, email, run } = data
  const [creating, setCreating] = useState(false)
  const newSheet = usePresence(creating ? true : null)

  /** Führt eine Änderung aus, meldet Erfolg oder einen verständlichen Fehler. Gibt zurück, ob es geklappt hat. */
  const act = useCallback(
    async (action: () => Promise<unknown>, success?: string) => {
      try {
        await run(action)
        if (success) onMessage(success)
        return true
      } catch (error) {
        console.error('Gruppe ändern fehlgeschlagen', error)
        onMessage(describeGroupError(error, t))
        return false
      }
    },
    [run, onMessage, t],
  )

  if (status === 'signed-out' || !email) {
    return (
      <PlaceholderView text={t.groups.signedOut} action={{ label: t.groups.toSettings, onClick: onGoToSettings }} />
    )
  }
  if (status === 'not-set-up') return <PlaceholderView text={t.groups.notSetUp} />
  if (status === 'loading' && groups.length === 0) return <PlaceholderView text={t.groups.loading} />
  if (status === 'error' && groups.length === 0) {
    return (
      <PlaceholderView
        text={t.groups.loadError}
        action={{ label: t.common.retry, onClick: () => void data.reload() }}
      />
    )
  }

  const notice = status === 'offline' ? t.groups.offline : status === 'error' ? t.groups.loadError : null
  const openGroup = groups.find((group) => group.id === openGroupId)

  if (openGroup) {
    return (
      <>
        {notice && <p className="groups__notice">{notice}</p>}
        <GroupDetail group={openGroup} myEmail={email} todayKey={todayKey} act={act} onBack={() => onOpenGroup(null)} />
      </>
    )
  }

  async function handleCreate(name: string, myName: string) {
    let newId = ''
    const created = await act(async () => {
      newId = await createGroup(name, myName)
    })
    if (created) {
      setCreating(false)
      onOpenGroup(newId)
    }
  }

  return (
    <div className="groups">
      {notice && <p className="groups__notice">{notice}</p>}
      {groups.length === 0 ? (
        <EmptyState title={t.groups.empty} text={t.groups.emptyText} onClick={() => setCreating(true)} />
      ) : (
        <ul className="groups__list">
          {groups.map((group) => {
            const open = openCountFor(group, email)
            return (
              <li key={group.id}>
                <button
                  type="button"
                  className="group-card"
                  aria-label={t.groups.open(group.name)}
                  onClick={() => onOpenGroup(group.id)}
                >
                  <span className="group-card__icon" aria-hidden="true">
                    <Icon name="groups" size={22} />
                  </span>
                  <span className="group-card__text">
                    <span className="group-card__name">
                      {group.name}
                      {isAdmin(group, email) && <span className="group-tag group-tag--accent">{t.groups.admin}</span>}
                    </span>
                    <span className={`group-card__open${open > 0 ? ' group-card__open--active' : ''}`}>
                      {t.groups.openForYou(open)}
                    </span>
                  </span>
                  <span className="group-card__people" aria-label={t.groups.members(group.members.length)}>
                    {group.members.slice(0, 4).map((member) => (
                      <Avatar key={member.email} name={member.display_name} colorKey={member.email} size={26} />
                    ))}
                  </span>
                  <Icon name="chevronRight" size={20} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <AddButton label={t.groups.newGroup} onClick={() => setCreating(true)} />
      {newSheet.shown && (
        <NewGroupSheet onCreate={handleCreate} onClose={() => setCreating(false)} closing={newSheet.closing} />
      )}
    </div>
  )
}

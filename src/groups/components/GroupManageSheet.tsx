import { useState, type FormEvent } from 'react'
import { Sheet } from '../../components/Sheet'
import { useI18n } from '../../i18n/useI18n'
import { deleteGroup, inviteMember, removeMember, renameGroup, setMemberRole } from '../groupStore'
import { isAdmin } from '../groupViews'
import type { Group } from '../types'
import { Avatar } from './Avatar'

interface GroupManageSheetProps {
  group: Group
  myEmail: string
  act: (action: () => Promise<unknown>, success?: string) => Promise<boolean>
  /** Die Gruppe ist weg (gelöscht oder verlassen) */
  onGone: () => void
  onClose: () => void
  closing?: boolean
}

/**
 * Mitglieder und Gruppe verwalten. Verwalter laden ein, ernennen weitere Verwalter, entfernen Mitglieder,
 * benennen um und löschen. Alle anderen sehen die Mitglieder und können die Gruppe verlassen.
 */
export function GroupManageSheet({ group, myEmail, act, onGone, onClose, closing }: GroupManageSheetProps) {
  const { t } = useI18n()
  const admin = isAdmin(group, myEmail)
  const adminCount = group.members.filter((member) => member.role === 'admin').length
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [name, setName] = useState(group.name)
  // Zweiter Tipp bestätigt: welche Aktion gerade auf Bestätigung wartet
  const [confirm, setConfirm] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function perform(action: () => Promise<unknown>, success?: string) {
    setBusy(true)
    const ok = await act(action, success)
    setBusy(false)
    setConfirm(null)
    return ok
  }

  async function handleInvite(event: FormEvent) {
    event.preventDefault()
    const email = inviteEmail.trim().toLowerCase()
    if (inviteName.trim() === '' || !email.includes('@')) return
    if (await perform(() => inviteMember(group.id, email, inviteName), t.groups.invitedToast(inviteName.trim()))) {
      setInviteName('')
      setInviteEmail('')
    }
  }

  async function handleLeave() {
    if (await perform(() => removeMember(group.id, myEmail))) onGone()
  }

  async function handleDelete() {
    if (await perform(() => deleteGroup(group.id))) onGone()
  }

  return (
    <Sheet title={group.name} onClose={onClose} closing={closing}>
      <div className="group-form">
        <section>
          <h3 className="group-form__heading">{t.groups.membersHeading}</h3>
          <ul className="group-members">
            {group.members.map((member) => {
              const isMe = member.email === myEmail
              return (
                <li key={member.email} className="group-members__item">
                  <Avatar name={member.display_name} colorKey={member.email} size={36} />
                  <span className="group-members__text">
                    <span className="group-members__name">
                      {member.display_name}
                      {isMe && ` (${t.groups.you})`}
                      {member.role === 'admin' && <span className="group-tag group-tag--accent">{t.groups.admin}</span>}
                    </span>
                    <span className="group-members__email">
                      {member.email}
                      {member.user_id === null && ` · ${t.groups.invited}`}
                    </span>
                  </span>
                  {admin && (
                    <span className="group-members__actions">
                      {/* Der letzte Verwalter kann sich nicht selbst herabstufen */}
                      {!(member.role === 'admin' && adminCount === 1) && (
                        <button
                          type="button"
                          className="button button--secondary button--small"
                          disabled={busy}
                          onClick={() =>
                            void perform(() =>
                              setMemberRole(group.id, member.email, member.role === 'admin' ? 'member' : 'admin'),
                            )
                          }
                        >
                          {member.role === 'admin' ? t.groups.removeAdmin : t.groups.makeAdmin}
                        </button>
                      )}
                      {!isMe && (
                        <button
                          type="button"
                          className={`button button--small ${confirm === member.email ? 'button--danger-strong' : 'button--danger'}`}
                          disabled={busy}
                          onClick={() =>
                            confirm === member.email
                              ? void perform(() => removeMember(group.id, member.email))
                              : setConfirm(member.email)
                          }
                        >
                          {confirm === member.email ? t.groups.confirmRemove : t.groups.removeMember}
                        </button>
                      )}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </section>

        {admin && (
          <form className="group-form__section" onSubmit={handleInvite}>
            <h3 className="group-form__heading">{t.groups.invite}</h3>
            <label className="task-field">
              <span className="task-field__label">{t.groups.inviteName}</span>
              <input
                className="field"
                type="text"
                value={inviteName}
                onChange={(event) => setInviteName(event.target.value)}
              />
            </label>
            <label className="task-field">
              <span className="task-field__label">{t.groups.inviteEmail}</span>
              <input
                className="field"
                type="email"
                autoComplete="off"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
              />
            </label>
            <p className="group-form__note">{t.groups.inviteHint}</p>
            <div className="group-form__actions">
              <button
                type="submit"
                className="button button--primary"
                disabled={busy || inviteName.trim() === '' || !inviteEmail.includes('@')}
              >
                {t.groups.inviteButton}
              </button>
            </div>
          </form>
        )}

        {admin && (
          <form
            className="group-form__section"
            onSubmit={(event) => {
              event.preventDefault()
              if (name.trim() !== '' && name.trim() !== group.name)
                void perform(() => renameGroup(group.id, name.trim()))
            }}
          >
            <label className="task-field">
              <span className="task-field__label">{t.groups.rename}</span>
              <input className="field" type="text" value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <div className="group-form__actions">
              <button
                type="submit"
                className="button button--secondary"
                disabled={busy || name.trim() === '' || name.trim() === group.name}
              >
                {t.groups.renameButton}
              </button>
            </div>
          </form>
        )}

        <div className="group-form__actions group-form__section">
          <button
            type="button"
            className={`button ${confirm === 'leave' ? 'button--danger-strong' : 'button--danger'}`}
            disabled={busy}
            onClick={() => (confirm === 'leave' ? void handleLeave() : setConfirm('leave'))}
          >
            {confirm === 'leave' ? t.groups.confirmLeave : t.groups.leave}
          </button>
          {admin && (
            <button
              type="button"
              className={`button ${confirm === 'delete' ? 'button--danger-strong' : 'button--danger'}`}
              disabled={busy}
              onClick={() => (confirm === 'delete' ? void handleDelete() : setConfirm('delete'))}
            >
              {confirm === 'delete' ? t.groups.confirmDeleteGroup : t.groups.deleteGroup}
            </button>
          )}
        </div>
      </div>
    </Sheet>
  )
}

import { useState, type FormEvent } from 'react'
import { Sheet } from '../../components/Sheet'
import { useI18n } from '../../i18n/useI18n'

interface NewGroupSheetProps {
  onCreate: (name: string, myName: string) => Promise<void>
  onClose: () => void
  closing?: boolean
}

/** Neue Gruppe anlegen: Name der Gruppe und der eigene Name darin */
export function NewGroupSheet({ onCreate, onClose, closing }: NewGroupSheetProps) {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [myName, setMyName] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (name.trim() === '' || myName.trim() === '') return
    setBusy(true)
    try {
      await onCreate(name.trim(), myName.trim())
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet title={t.groups.newGroup} onClose={onClose} closing={closing}>
      <form className="group-form" onSubmit={handleSubmit}>
        <label className="task-field">
          <span className="task-field__label">{t.groups.groupName}</span>
          <input
            className="field"
            type="text"
            placeholder={t.groups.groupNamePlaceholder}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="task-field">
          <span className="task-field__label">{t.groups.myName}</span>
          <input
            className="field"
            type="text"
            autoComplete="given-name"
            value={myName}
            onChange={(event) => setMyName(event.target.value)}
          />
        </label>
        <div className="group-form__actions">
          <button
            type="submit"
            className="button button--primary"
            disabled={busy || name.trim() === '' || myName.trim() === ''}
          >
            {t.groups.create}
          </button>
        </div>
      </form>
    </Sheet>
  )
}

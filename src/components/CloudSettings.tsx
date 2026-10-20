import { useState, type FormEvent } from 'react'
import type { CloudSync } from '../sync/useCloudSync'
import { useI18n } from '../i18n/useI18n'

interface CloudSettingsProps {
  cloud: CloudSync
}

/**
 * Optionen-Karte "Automatische Sicherung": Anmelden mit E-Mail und Code, danach Stand der Sicherung.
 * Ein Code statt nur eines Links, weil ein Link aus der E-Mail auf dem Handy im Browser
 * statt in der installierten App aufgehen würde.
 */
export function CloudSettings({ cloud }: CloudSettingsProps) {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSendCode(event: FormEvent) {
    event.preventDefault()
    const address = email.trim()
    if (address === '') return
    setBusy(true)
    setMessage(null)
    try {
      await cloud.sendCode(address)
      setCodeSentTo(address)
      setCode('')
    } catch (error) {
      console.error('Code verschicken fehlgeschlagen', error)
      setMessage(t.cloud.sendFailed)
    } finally {
      setBusy(false)
    }
  }

  async function handleVerify(event: FormEvent) {
    event.preventDefault()
    if (!codeSentTo || code.trim() === '') return
    setBusy(true)
    setMessage(null)
    try {
      await cloud.verifyCode(codeSentTo, code.trim())
      setCodeSentTo(null)
    } catch (error) {
      console.error('Anmelden fehlgeschlagen', error)
      setMessage(t.cloud.wrongCode)
    } finally {
      setBusy(false)
    }
  }

  if (cloud.email) {
    const status =
      cloud.syncState === 'syncing'
        ? t.cloud.syncing
        : cloud.syncState === 'offline'
          ? t.cloud.offline
          : cloud.syncState === 'error'
            ? t.cloud.error
            : cloud.lastSyncedAt
              ? t.cloud.synced(
                  new Date(cloud.lastSyncedAt).toLocaleString(t.locale, { dateStyle: 'medium', timeStyle: 'short' }),
                )
              : t.cloud.neverSynced
    const warn = cloud.syncState === 'error' || cloud.syncState === 'offline'

    return (
      <section className="settings__group">
        <h2 className="settings__heading">{t.cloud.heading}</h2>
        <p className="settings__text">{t.cloud.signedInAs(cloud.email)}</p>
        <p className={`settings__text settings__status${warn ? ' settings__status--warn' : ''}`} role="status">
          {status}
        </p>
        <div className="settings__actions">
          <button
            type="button"
            className="button button--secondary"
            disabled={cloud.syncState === 'syncing'}
            onClick={cloud.syncNow}
          >
            {t.cloud.syncNow}
          </button>
          <button type="button" className="button button--secondary" onClick={() => void cloud.signOut()}>
            {t.cloud.signOut}
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="settings__group">
      <h2 className="settings__heading">{t.cloud.heading}</h2>
      {codeSentTo ? (
        <form className="settings__form" onSubmit={handleVerify}>
          <p className="settings__text">{t.cloud.codeSent(codeSentTo)}</p>
          <label className="task-field">
            <span className="task-field__label">{t.cloud.codeLabel}</span>
            <input
              className="field"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </label>
          <div className="settings__actions">
            <button type="submit" className="button button--primary" disabled={busy || code.trim() === ''}>
              {t.cloud.signIn}
            </button>
            <button type="button" className="button button--secondary" onClick={() => setCodeSentTo(null)}>
              {t.cloud.otherEmail}
            </button>
          </div>
        </form>
      ) : (
        <form className="settings__form" onSubmit={handleSendCode}>
          <p className="settings__text">{t.cloud.intro}</p>
          <label className="task-field">
            <span className="task-field__label">{t.cloud.emailLabel}</span>
            <input
              className="field"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <div className="settings__actions">
            <button type="submit" className="button button--primary" disabled={busy || email.trim() === ''}>
              {t.cloud.sendCode}
            </button>
          </div>
        </form>
      )}
      {message && (
        <p className="settings__text settings__status settings__status--warn" role="alert">
          {message}
        </p>
      )}
    </section>
  )
}

import { useEffect, useState } from 'react'
import { disablePush, enablePush, getPushState, PushDeniedError, sendTestPush, type PushState } from '../sync/push'
import { useI18n } from '../i18n/useI18n'

interface ReminderSettingsProps {
  /** Angemeldet bei der automatischen Sicherung: nur dann kennt der Erinnerungsdienst die Aufgaben */
  signedIn: boolean
}

/** Kurze Fehlerbeschreibung, damit sich Probleme beim Einrichten finden lassen */
function errorText(error: unknown): string {
  const { message } = (error ?? {}) as { message?: string }
  return message || String(error)
}

/** Optionen-Karte "Erinnerungen": Benachrichtigungen auf diesem Gerät ein- und ausschalten, Test schicken. */
export function ReminderSettings({ signedIn }: ReminderSettingsProps) {
  const { t } = useI18n()
  const [state, setState] = useState<PushState | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ text: string; warn: boolean } | null>(null)

  useEffect(() => {
    let cancelled = false
    void getPushState().then((next) => !cancelled && setState(next))
    return () => {
      cancelled = true
    }
  }, [])

  async function run(action: () => Promise<void>, success?: string) {
    setBusy(true)
    setMessage(null)
    try {
      await action()
      if (success) setMessage({ text: success, warn: false })
    } catch (error) {
      console.error('Erinnerungen', error)
      setMessage({
        text: error instanceof PushDeniedError ? t.reminders.denied : `${t.reminders.failed} (${errorText(error)})`,
        warn: true,
      })
    } finally {
      setState(await getPushState())
      setBusy(false)
    }
  }

  let content
  if (!signedIn) {
    content = <p className="settings__text">{t.reminders.needsSignIn}</p>
  } else if (state === 'needs-install' || state === 'unsupported' || state === 'denied') {
    const text = { 'needs-install': t.reminders.needsInstall, unsupported: t.reminders.unsupported, denied: t.reminders.denied }
    content = <p className="settings__text settings__status settings__status--warn">{text[state]}</p>
  } else if (state === 'on') {
    content = (
      <>
        <p className="settings__text settings__status">{t.reminders.on}</p>
        <div className="settings__actions">
          <button type="button" className="button button--secondary" disabled={busy} onClick={() => run(sendTestPush, t.reminders.testSent)}>
            {t.reminders.test}
          </button>
          <button type="button" className="button button--secondary" disabled={busy} onClick={() => run(disablePush)}>
            {t.reminders.disable}
          </button>
        </div>
      </>
    )
  } else if (state === 'off') {
    content = (
      <div className="settings__actions">
        <button type="button" className="button button--primary" disabled={busy} onClick={() => run(enablePush)}>
          {t.reminders.enable}
        </button>
      </div>
    )
  }

  return (
    <section className="settings__group">
      <h2 className="settings__heading">{t.reminders.heading}</h2>
      <p className="settings__text">{t.reminders.intro}</p>
      {content}
      {message && (
        <p
          className={`settings__text settings__status${message.warn ? ' settings__status--warn' : ''}`}
          role={message.warn ? 'alert' : 'status'}
        >
          {message.text}
        </p>
      )}
    </section>
  )
}

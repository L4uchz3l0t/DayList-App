import { useState } from 'react'
import { connectGoogle } from '../google/googleCalendar'
import type { GoogleCalendarData } from '../google/useGoogleCalendar'
import { useI18n } from '../i18n/useI18n'

interface GoogleSettingsProps {
  google: GoogleCalendarData
}

/** Optionen-Karte "Google Kalender": verbinden, Kalender auswählen, trennen. */
export function GoogleSettings({ google }: GoogleSettingsProps) {
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  // Gewählte Kalender springen sofort um, auch wenn Google noch antwortet
  const [pending, setPending] = useState<string[] | null>(null)
  const isShown = (id: string, fromCloud: boolean) => (pending ? pending.includes(id) : fromCloud)

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setFailure(null)
    try {
      await action()
    } catch (error) {
      console.error('Google Kalender', error)
      setFailure(`${t.google.error} (${(error as Error)?.message ?? String(error)})`)
    } finally {
      setBusy(false)
    }
  }

  function toggleCalendar(id: string, shown: boolean) {
    const next = google.calendars
      .filter((calendar) => (calendar.id === id ? shown : isShown(calendar.id, calendar.shown)))
      .map((calendar) => calendar.id)
    setPending(next)
    void run(() => google.select(next)).finally(() => setPending(null))
  }

  const connectButton = (
    <div className="settings__actions">
      <button type="button" className="button button--primary" disabled={busy} onClick={() => run(connectGoogle)}>
        {busy ? t.google.connecting : t.google.connect}
      </button>
    </div>
  )

  let content
  switch (google.status) {
    case 'signed-out':
      content = <p className="settings__text">{t.google.needsSignIn}</p>
      break
    case 'not-set-up':
      content = <p className="settings__text settings__status settings__status--warn">{t.google.notSetUp}</p>
      break
    case 'loading':
      content = null
      break
    case 'expired':
      content = (
        <>
          <p className="settings__text settings__status settings__status--warn">{t.google.expired}</p>
          {connectButton}
        </>
      )
      break
    case 'not-connected':
      content = connectButton
      break
    case 'error':
    case 'connected':
      content = (
        <>
          {google.status === 'error' && (
            <p className="settings__text settings__status settings__status--warn">
              {t.google.error}
              {google.errorText && ` (${google.errorText})`}
            </p>
          )}
          {google.email && <p className="settings__text settings__status">{t.google.connectedAs(google.email)}</p>}
          {google.calendars.length > 0 && (
            <fieldset className="google-calendars">
              <legend className="settings__hint">{t.google.calendars}</legend>
              {google.calendars.map((calendar) => (
                <label key={calendar.id} className="google-calendars__item">
                  <input
                    type="checkbox"
                    checked={isShown(calendar.id, calendar.shown)}
                    onChange={(event) => toggleCalendar(calendar.id, event.target.checked)}
                  />
                  <span className="google-calendars__color" style={{ background: calendar.color }} aria-hidden="true" />
                  {calendar.name}
                </label>
              ))}
            </fieldset>
          )}
          <div className="settings__actions">
            <button
              type="button"
              className={`button ${confirm ? 'button--danger-strong' : 'button--secondary'}`}
              disabled={busy}
              onClick={() => (confirm ? void run(google.disconnect) : setConfirm(true))}
            >
              {confirm ? t.google.confirmDisconnect : t.google.disconnect}
            </button>
          </div>
        </>
      )
      break
  }

  return (
    <section className="settings__group">
      <h2 className="settings__heading">{t.google.heading}</h2>
      <p className="settings__text">{t.google.intro}</p>
      {content}
      {failure && (
        <p className="settings__text settings__status settings__status--warn" role="alert">
          {failure}
        </p>
      )}
    </section>
  )
}

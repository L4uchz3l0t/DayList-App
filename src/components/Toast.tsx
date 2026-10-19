import { useEffect } from 'react'
import './Toast.css'

export interface ToastMessage {
  id: number
  text: string
  /** Optionale Aktion, zum Beispiel "Rückgängig" */
  action?: { label: string; onClick: () => void }
}

interface ToastProps {
  message: ToastMessage
  onDismiss: () => void
}

/** Kurze Rückmeldung am unteren Rand, verschwindet nach einigen Sekunden von selbst. */
export function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 6000)
    return () => window.clearTimeout(timer)
  }, [message.id, onDismiss])

  return (
    <div className="toast" role="status">
      <span className="toast__text">{message.text}</span>
      {message.action && (
        <button
          type="button"
          className="toast__action"
          onClick={() => {
            message.action?.onClick()
            onDismiss()
          }}
        >
          {message.action.label}
        </button>
      )}
    </div>
  )
}

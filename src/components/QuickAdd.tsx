import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Icon } from './Icon'
import './QuickAdd.css'

export type QuickAddTarget = 'inbox' | 'today' | 'tomorrow'

const TARGETS: { id: QuickAddTarget; label: string }[] = [
  { id: 'inbox', label: 'Eingang' },
  { id: 'today', label: 'Heute' },
  { id: 'tomorrow', label: 'Morgen' },
]

interface QuickAddProps {
  onSave: (title: string, target: QuickAddTarget) => void
  onClose: () => void
}

/**
 * Schnellaufnahme: Titel tippen, Enter drücken, fertig.
 * Ohne Auswahl landet die Aufgabe im Eingang. Danach ist das Feld sofort wieder bereit.
 */
export function QuickAdd({ onSave, onClose }: QuickAddProps) {
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState<QuickAddTarget>('inbox')
  const [savedTitle, setSavedTitle] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = title.trim()
    if (trimmed === '') return
    onSave(trimmed, target)
    setSavedTitle(trimmed)
    setTitle('')
    inputRef.current?.focus()
  }

  const targetLabel = TARGETS.find((t) => t.id === target)?.label

  return (
    <div className="quick-add__backdrop" onClick={onClose}>
      <form
        className="quick-add"
        role="dialog"
        aria-modal="true"
        aria-label="Neue Aufgabe"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="quick-add__header">
          <h2 className="quick-add__heading">Neue Aufgabe</h2>
          <button type="button" className="quick-add__close" aria-label="Schließen" onClick={onClose}>
            <Icon name="close" size={20} />
          </button>
        </div>

        <input
          ref={inputRef}
          className="quick-add__input"
          type="text"
          placeholder="Was möchtest du nicht vergessen?"
          aria-label="Titel der Aufgabe"
          enterKeyHint="done"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value)
            setSavedTitle(null)
          }}
        />

        <div className="quick-add__row">
          <div className="quick-add__targets" role="radiogroup" aria-label="Wann?">
            {TARGETS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={target === t.id}
                className="quick-add__chip"
                onClick={() => setTarget(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button type="submit" className="quick-add__save" disabled={title.trim() === ''}>
            Speichern
          </button>
        </div>

        <p className="quick-add__status" role="status">
          {savedTitle ? `✓ „${savedTitle}“ gespeichert (${targetLabel})` : ''}
        </p>
      </form>
    </div>
  )
}

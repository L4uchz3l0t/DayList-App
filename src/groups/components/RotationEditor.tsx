import { Icon } from '../../components/Icon'
import { useI18n } from '../../i18n/useI18n'
import { Avatar } from './Avatar'

export interface RotationEntry {
  email: string
  name: string
  /** Macht bei der Wiederholung mit */
  included: boolean
}

interface RotationEditorProps {
  entries: RotationEntry[]
  onChange: (entries: RotationEntry[]) => void
}

/** Reihenfolge für wiederkehrende Aufgaben: wer mitmacht und wer wann dran ist */
export function RotationEditor({ entries, onChange }: RotationEditorProps) {
  const { t } = useI18n()
  let round = 0

  function move(index: number, step: number) {
    const next = [...entries]
    const [entry] = next.splice(index, 1)
    next.splice(index + step, 0, entry)
    onChange(next)
  }

  function toggle(index: number) {
    onChange(entries.map((entry, i) => (i === index ? { ...entry, included: !entry.included } : entry)))
  }

  return (
    <div className="rotation">
      <p className="rotation__title">
        <Icon name="repeat" size={16} /> {t.groups.rotationTitle}
      </p>
      <p className="rotation__hint">{t.groups.rotationHint}</p>
      <ol className="rotation__list">
        {entries.map((entry, index) => (
          <li key={entry.email} className={`rotation__item${entry.included ? '' : ' rotation__item--out'}`}>
            <input
              type="checkbox"
              className="rotation__check"
              checked={entry.included}
              aria-label={t.groups.takesPart(entry.name)}
              onChange={() => toggle(index)}
            />
            <Avatar name={entry.name} colorKey={entry.email} />
            <span className="rotation__name">{entry.name}</span>
            <span className="rotation__when">{entry.included ? t.groups.rotationWhen(round++) : ''}</span>
            <button
              type="button"
              className="rotation__move"
              aria-label={t.groups.moveUp(entry.name)}
              disabled={index === 0}
              onClick={() => move(index, -1)}
            >
              <Icon name="arrowUp" size={18} />
            </button>
            <button
              type="button"
              className="rotation__move"
              aria-label={t.groups.moveDown(entry.name)}
              disabled={index === entries.length - 1}
              onClick={() => move(index, 1)}
            >
              <Icon name="arrowDown" size={18} />
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

import { Icon } from './Icon'
import './AddButton.css'
import { useI18n } from '../i18n/useI18n'

interface AddButtonProps {
  onClick: () => void
  /** Vorgelesener Name, Standard: Neue Aufgabe */
  label?: string
}

/** Der runde Plus-Button unten rechts. */
export function AddButton({ onClick, label }: AddButtonProps) {
  const { t } = useI18n()
  return (
    <button type="button" className="add-button" aria-label={label ?? t.quickAdd.title} onClick={onClick}>
      <Icon name="plus" size={28} />
    </button>
  )
}

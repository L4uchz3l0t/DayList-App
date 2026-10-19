import { Icon } from './Icon'
import './AddButton.css'

interface AddButtonProps {
  onClick: () => void
}

/** Der runde Plus-Button unten rechts. */
export function AddButton({ onClick }: AddButtonProps) {
  return (
    <button type="button" className="add-button" aria-label="Neue Aufgabe" onClick={onClick}>
      <Icon name="plus" size={28} />
    </button>
  )
}

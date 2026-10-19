import { Icon } from './Icon'
import './AddButton.css'
import { useI18n } from '../i18n/useI18n'

interface AddButtonProps {
  onClick: () => void
}

/** Der runde Plus-Button unten rechts. */
export function AddButton({ onClick }: AddButtonProps) {
  const { t } = useI18n()
  return (
    <button type="button" className="add-button" aria-label={t.quickAdd.title} onClick={onClick}>
      <Icon name="plus" size={28} />
    </button>
  )
}

import { Switch } from '@/components/ui/switch'

interface ConstraintToggleProps {
  checked: boolean
  disabled: boolean
  onToggle: (checked: boolean) => void
}

export function ConstraintToggle({ checked, disabled, onToggle }: ConstraintToggleProps) {
  return (
    <Switch
      checked={checked}
      onCheckedChange={onToggle}
      disabled={disabled}
    />
  )
}

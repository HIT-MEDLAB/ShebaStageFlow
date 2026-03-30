import type { DropdownProps } from "react-day-picker"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function CalendarDropdown({
  options,
  value,
  onChange,
  "aria-label": ariaLabel,
}: DropdownProps) {
  const selected = options?.find((o) => o.value === Number(value))

  return (
    <Select
      value={String(value)}
      onValueChange={(v) => {
        onChange?.({ target: { value: v } } as React.ChangeEvent<HTMLSelectElement>)
      }}
    >
      <SelectTrigger aria-label={ariaLabel} className="h-7 text-xs font-medium">
        <SelectValue>{selected?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options?.map((option) => (
          <SelectItem
            key={option.value}
            value={String(option.value)}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

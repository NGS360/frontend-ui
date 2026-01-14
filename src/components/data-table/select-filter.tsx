import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface SelectFilterOption {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
}

interface SelectFilterProps {
  label: string
  icon: React.ComponentType<{ className?: string }>
  options: Array<SelectFilterOption>
  value?: string | null
  onChange: (value: string | null) => void
  placeholder?: string
}

export function SelectFilter({
  label,
  icon: Icon,
  options,
  value,
  onChange,
}: SelectFilterProps) {
  const selectedOption = options.find((opt) => opt.value === value)
  const hasSelection = !!value

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="default" className="gap-2">
          <Icon className="h-4 w-4" />
          <span>{label}</span>
          {hasSelection && (
            <>
              <div className="h-4 w-[1px] bg-border" />
              <Badge variant="secondary" className="px-1.5 font-normal">
                {selectedOption?.label || value}
              </Badge>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hasSelection && (
          <>
            <div className="px-2 py-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange(null)}
                className="w-full justify-start h-8 px-2"
              >
                <X className="mr-2 h-3.5 w-3.5" />
                Clear filter
              </Button>
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        {options.map((option) => {
          const isSelected = value === option.value
          const OptionIcon = option.icon

          return (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={isSelected}
              onCheckedChange={() => {
                onChange(isSelected ? null : option.value)
              }}
              className="gap-2"
            >
              {OptionIcon && <OptionIcon className="h-4 w-4" />}
              <span className="flex-1">{option.label}</span>
              {isSelected && <Check className="h-4 w-4" />}
            </DropdownMenuCheckboxItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

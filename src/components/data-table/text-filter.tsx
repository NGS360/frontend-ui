import { X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface TextFilterProps {
  label: string
  icon: React.ComponentType<{ className?: string }>
  value?: string | null
  onChange: (value: string | null) => void
  placeholder?: string
}

export function TextFilter({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder = "Enter text...",
}: TextFilterProps) {
  const [open, setOpen] = useState(false)
  const hasValue = !!value

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="default" className="gap-2">
          <Icon className="h-4 w-4" />
          <span>{label}</span>
          {hasValue && (
            <>
              <div className="h-4 w-[1px] bg-border" />
              <Badge variant="secondary" className="px-1.5 font-normal">
                {value}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">{label}</label>
            <Input
              placeholder={placeholder}
              value={value || ""}
              onChange={(e) => onChange(e.target.value || null)}
              onKeyDown={handleKeyDown}
              className="h-9"
            />
          </div>
          {hasValue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
              className="w-full justify-start"
            >
              <X className="mr-2 h-3.5 w-3.5" />
              Clear filter
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

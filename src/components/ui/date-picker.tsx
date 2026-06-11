import * as React from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import type { Matcher } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export interface DatePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: Matcher | Array<Matcher>
  id?: string
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled,
  id,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (date: Date | undefined) => {
    onChange(date)
    if (date) setOpen(false)
  }

  const handleToday = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    onChange(today)
    setOpen(false)
  }

  const handleClear = () => {
    onChange(undefined)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'PPP') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          disabled={disabled}
          autoFocus
        />
        <div className="flex items-center justify-between border-t p-2">
          <Button variant="ghost" size="sm" type="button" onClick={handleToday}>
            Today
          </Button>
          <Button variant="ghost" size="sm" type="button" onClick={handleClear}>
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

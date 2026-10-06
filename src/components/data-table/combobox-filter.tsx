import { X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxFilterOption {
  label: string
  value: string
  /** Second line, in the manner of the "@" mention results. */
  sublabel?: string
}

interface ComboboxFilterProps {
  label: string
  icon: React.ComponentType<{ className?: string }>
  options: Array<ComboboxFilterOption>
  /** Selected values. Several may be held at once; order is not meaningful. */
  values: Array<string>
  onValuesChange: (values: Array<string>) => void
  /** Placeholder for the box that searches the options. */
  placeholder?: string
  emptyMessage?: string
  /** Options still on their way, so the empty list is not yet a no-match. */
  isLoading?: boolean

  /* ---- server-side search and paging ---- */

  /**
   * Supply both to own the search term, for options that come from a server a
   * page at a time. Doing so turns off the built-in filtering: the options
   * given are already the answer, and filtering them again here would hide
   * matches the server found. Omit both and the list filters itself.
   */
  searchValue?: string
  onSearchChange?: (search: string) => void
  /** More options exist beyond the ones given. */
  hasMore?: boolean
  onLoadMore?: () => void
  /** Shown under the list -- say, how to reach options paging cannot. */
  hint?: string
  /**
   * Fired when the list is shown or hidden, so a caller can hold off
   * fetching options until something actually asks to see them.
   */
  onOpenChange?: (open: boolean) => void
}

/**
 * SelectFilter for a list too long to scroll: same trigger, searchable body,
 * and more than one value selectable.
 *
 * The third filter in this family, and the one to reach for when the values
 * are data rather than an enum -- a search box over them beats both a long
 * dropdown and a text input the caller has to type an exact value into.
 */
export function ComboboxFilter({
  label,
  icon: Icon,
  options,
  values,
  onValuesChange,
  placeholder = "Search...",
  emptyMessage = "No matches.",
  isLoading = false,
  searchValue,
  onSearchChange,
  hasMore = false,
  onLoadMore,
  hint,
  onOpenChange,
}: ComboboxFilterProps) {
  const [open, setOpen] = useState(false)
  const isServerSearched = onSearchChange !== undefined
  const hasSelection = values.length > 0

  // Selecting does not close the popover: picking several in one visit is the
  // point, and a popover that shuts on each click makes that a chore.
  const toggle = (option: string) => {
    onValuesChange(
      values.includes(option)
        ? values.filter((selected) => selected !== option)
        : [...values, option]
    )
  }

  // A selection made from an earlier page, or before a search term narrowed
  // the list, is still in force -- so it stays rendered, and at the top,
  // rather than disappearing from the list that claims to show it.
  const optionsByValue = new Map(options.map((option) => [option.value, option]))
  const selectedOptions = values.map(
    (selected) => optionsByValue.get(selected) ?? { label: selected, value: selected }
  )
  const unselectedOptions = options.filter((option) => !values.includes(option.value))
  const displayedOptions = [...selectedOptions, ...unselectedOptions]

  // Reopening shows the default page rather than whatever was last typed,
  // which would otherwise look like options going missing.
  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) onSearchChange?.("")
    onOpenChange?.(next)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="default" className="gap-2">
          <Icon className="h-4 w-4" />
          <span>{label}</span>
          {hasSelection && (
            <>
              <div className="h-4 w-[1px] bg-border" />
              <Badge variant="secondary" className="px-1.5 font-normal">
                {/* One reads better by name; several would not fit, and the
                    list below shows which. */}
                {values.length === 1
                  ? optionsByValue.get(values[0])?.label || values[0]
                  : `${values.length} selected`}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        <Command shouldFilter={!isServerSearched}>
          <CommandInput
            placeholder={placeholder}
            {...(isServerSearched && {
              value: searchValue ?? "",
              onValueChange: onSearchChange,
            })}
          />
          <CommandList>
            <CommandEmpty>{isLoading ? "Loading..." : emptyMessage}</CommandEmpty>
            <CommandGroup>
              {displayedOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  keywords={[option.label]}
                  onSelect={() => toggle(option.value)}
                >
                  {/* Display only: the row's onSelect owns the toggle, so an
                      interactive checkbox here would fire it twice. */}
                  <Checkbox
                    checked={values.includes(option.value)}
                    className="pointer-events-none mr-2"
                    tabIndex={-1}
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{option.label}</span>
                    {option.sublabel && (
                      <span className="truncate text-xs text-muted-foreground">
                        {option.sublabel}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {hasMore && onLoadMore && (
            <div className="border-t p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onLoadMore}
                disabled={isLoading}
                className="w-full justify-center"
              >
                Load more
              </Button>
            </div>
          )}
          {hint && (
            <div className="border-t px-3 py-2 text-xs text-muted-foreground">
              {hint}
            </div>
          )}
          {/* Outside CommandList, so typing a term cannot filter away the
              one control that undoes the filter. */}
          {hasSelection && (
            <div className="border-t p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onValuesChange([])}
                className="w-full justify-start"
              >
                <X className="mr-2 h-3.5 w-3.5" />
                {values.length > 1 ? "Clear all" : "Clear filter"}
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}

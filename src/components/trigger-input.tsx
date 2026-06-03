import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type { Attribute, ProjectPublic, SequencingRunPublic } from "@/client"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandItem, CommandList } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useTriggerCombobox } from "@/hooks/use-trigger-combobox"
import { searchOptions, searchUsersOptions } from "@/client/@tanstack/react-query.gen"
import { entityMeta } from "@/lib/entity-icons"

interface SearchItem {
  id: string
  label: string
  sublabel: string
  type: "project" | "run" | "user"
  details: Record<string, string | null>
  attributes?: Array<Attribute> | null
}

interface TriggerInputProps extends Omit<React.ComponentProps<typeof Input>, "onChange"> {
  value: string
  onChange: (value: string) => void
}

export const TriggerInput: React.FC<TriggerInputProps> = ({
  value,
  onChange,
  ...inputProps
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [activeTrigger, setActiveTrigger] = useState<string | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  const { data: searchResults, isFetching: isFetchingSearch } = useQuery({
    ...searchOptions({ query: { query: searchQuery, n_results: 5 } }),
    enabled: searchQuery.length >= 1 && activeTrigger === "#",
  })

  const { data: userResults, isFetching: isFetchingUsers } = useQuery({
    ...searchUsersOptions({ query: { q: userSearchQuery, limit: 10 } }),
    enabled: userSearchQuery.length >= 2 && activeTrigger === "@",
  })

  const isFetching = activeTrigger === "@" ? isFetchingUsers : isFetchingSearch

  const items: Array<SearchItem> = useMemo(() => {
    if (activeTrigger === "@") {
      if (!userResults) return []
      return userResults.data.map((u) => ({
        id: u.username,
        label: u.full_name || u.username,
        sublabel: u.username,
        type: "user" as const,
        details: {
          "Username": u.username,
          "Email": u.email ?? null,
          "Department": u.department ?? null,
          "Title": u.title ?? null,
        },
        attributes: null,
      }))
    }
    if (!searchResults) return []
    const projectItems = (searchResults.projects.data).map((p: ProjectPublic) => ({
      id: p.project_id,
      label: p.name || p.project_id,
      sublabel: p.project_id,
      type: "project" as const,
      details: { "Project ID": p.project_id },
      attributes: p.attributes,
    }))
    const runItems = (searchResults.runs.data).map((r: SequencingRunPublic) => ({
      id: r.run_id,
      label: r.experiment_name || r.run_id,
      sublabel: r.run_id,
      type: "run" as const,
      details: {
        "Run ID": r.run_id,
        "Experiment": r.experiment_name,
        "Date": r.run_date,
        "Flowcell": r.flowcell_id,
      },
      attributes: null,
    }))
    return [...projectItems, ...runItems]
  }, [searchResults, userResults, activeTrigger])

  useEffect(() => {
    if (items.length > 0) {
      setHighlightedId(items[0].id)
    } else {
      setHighlightedId(null)
    }
  }, [items])

  const highlightedItem = useMemo(
    () => items.find(i => i.id === highlightedId) ?? null,
    [items, highlightedId]
  )

  const handleHashSearch = useCallback((query: string) => {
    setActiveTrigger("#")
    setSearchQuery(query)
  }, [])

  const handleAtSearch = useCallback((query: string) => {
    setActiveTrigger("@")
    setUserSearchQuery(query)
  }, [])

  const handleSelect = useCallback((triggerChar: string, selectedValue: string, el: HTMLInputElement | HTMLTextAreaElement) => {
    const cursorPos = el.selectionStart ?? value.length
    const textBeforeCursor = value.slice(0, cursorPos)

    // Find the trigger start position
    const lastTriggerIndex = textBeforeCursor.lastIndexOf(triggerChar)
    if (lastTriggerIndex < 0) return

    const before = value.slice(0, lastTriggerIndex)
    const after = value.slice(cursorPos)
    const newValue = before + selectedValue + (after.startsWith(" ") ? after : " " + after)
    onChange(newValue.trimEnd())

    // Reset cursor position after React re-renders
    requestAnimationFrame(() => {
      const newCursorPos = (before + selectedValue + " ").length
      el.setSelectionRange(newCursorPos, newCursorPos)
      el.focus()
    })
  }, [value, onChange])

  const { inputRef, triggerState, popoverOpen, handleInputChange, handleSelect: selectItem, dismiss } = useTriggerCombobox({
    triggers: [
      { char: "#", onSearch: handleHashSearch },
      { char: "@", onSearch: handleAtSearch, minQueryLength: 2 },
    ],
    onSelect: handleSelect,
  })

  const commandRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!popoverOpen) {
      setSearchQuery("")
      setUserSearchQuery("")
      setActiveTrigger(null)
      setHighlightedId(null)
    }
  }, [popoverOpen])

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    const cursorPos = e.target.selectionStart ?? newValue.length
    handleInputChange(newValue, cursorPos)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!popoverOpen) return
    if (e.key === "Escape") {
      e.preventDefault()
      e.stopPropagation()
      dismiss()
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
      e.preventDefault()
      const cmdk = commandRef.current?.querySelector("[cmdk-root]") as HTMLElement | null
      cmdk?.dispatchEvent(
        new KeyboardEvent("keydown", { key: e.key, bubbles: true })
      )
      // Update highlighted item after cmdk processes the event
      requestAnimationFrame(() => {
        const selected = commandRef.current?.querySelector("[data-selected=true]") as HTMLElement | null
        setHighlightedId(selected?.getAttribute("data-value") ?? null)
      })
    }
  }

  return (
    <Popover open={popoverOpen && triggerState.isActive} onOpenChange={(open) => { if (!open) dismiss() }}>
      <PopoverAnchor asChild>
        <Input
          {...inputProps}
          ref={(el) => { inputRef.current = el }}
          value={value}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
        />
      </PopoverAnchor>
      <PopoverContent
        className="p-0 w-auto"
        side="bottom"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex">
          <div ref={commandRef} className="w-72">
            <Command shouldFilter={false}>
              <CommandList>
                {isFetching ? (
                  <div className="py-4 text-center text-sm text-muted-foreground">Searching...</div>
                ) : items.length === 0 ? (
                  <CommandEmpty>
                    {triggerState.query.length === 0
                      ? "Type to search..."
                      : activeTrigger === "@" && triggerState.query.length < 2
                        ? "Type at least 2 characters..."
                        : "No results found."}
                  </CommandEmpty>
                ) : (
                  items.map((item) => {
                    const { icon: Icon, colorClass } = entityMeta[item.type]
                    return (
                      <CommandItem
                        key={`${item.type}-${item.id}`}
                        value={item.id}
                        onSelect={() => selectItem(item.id)}
                        onMouseEnter={() => setHighlightedId(item.id)}
                      >
                        <Icon className={`size-4 ${colorClass}`} />
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="truncate text-sm">{item.label}</span>
                          {item.label !== item.sublabel && (
                            <span className="text-xs text-muted-foreground truncate">{item.sublabel}</span>
                          )}
                        </div>
                        <Badge variant="outline" className="text-[10px] ml-auto">
                          {item.type === "project" ? "Project" : item.type === "run" ? "Run" : "User"}
                        </Badge>
                      </CommandItem>
                    )
                  })
                )}
              </CommandList>
            </Command>
          </div>
          {highlightedItem && (
            <div className="hidden sm:block w-56 border-l p-3 text-xs overflow-y-auto max-h-[300px]">
              <div className="font-medium text-sm mb-2 break-all">{highlightedItem.label}</div>
              <dl className="space-y-1">
                {Object.entries(highlightedItem.details).map(([key, val]) =>
                  val ? (
                    <div key={key}>
                      <dt className="text-muted-foreground">{key}</dt>
                      <dd className="font-medium break-words">{val}</dd>
                    </div>
                  ) : null
                )}
              </dl>
              {highlightedItem.attributes && highlightedItem.attributes.length > 0 && (
                <div className="mt-2 pt-2 border-t">
                  <span className="text-muted-foreground">Attributes</span>
                  <dl className="mt-1 space-y-0.5">
                    {highlightedItem.attributes.map((attr, i) => (
                      <div key={i} className="flex gap-1">
                        <dt className="text-muted-foreground shrink-0">{attr.key}:</dt>
                        <dd className="break-words">{attr.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

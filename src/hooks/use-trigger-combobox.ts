import { useCallback, useEffect, useRef, useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"

export interface TriggerConfig {
  char: string
  onSearch: (query: string) => void
  minQueryLength?: number
}

export interface TriggerState {
  isActive: boolean
  triggerChar: string | null
  query: string
  startIndex: number
}

interface UseTriggerComboboxOptions {
  triggers: Array<TriggerConfig>
  debounceMs?: number
  onSelect: (triggerChar: string, value: string, inputElement: HTMLInputElement | HTMLTextAreaElement) => void
}

export function useTriggerCombobox({ triggers, debounceMs = 300, onSelect }: UseTriggerComboboxOptions) {
  const [triggerState, setTriggerState] = useState<TriggerState>({
    isActive: false,
    triggerChar: null,
    query: "",
    startIndex: 0,
  })
  const [popoverOpen, setPopoverOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  const triggerChars = triggers.map(t => t.char)

  const debouncedQuery = useDebounce(triggerState.query, debounceMs)

  useEffect(() => {
    if (!triggerState.isActive || !triggerState.triggerChar) return
    const config = triggers.find(t => t.char === triggerState.triggerChar)
    if (!config) return
    const minLen = config.minQueryLength ?? 1
    if (debouncedQuery.length >= minLen) {
      config.onSearch(debouncedQuery)
    }
  }, [debouncedQuery, triggerState.isActive, triggerState.triggerChar, triggers])

  const handleInputChange = useCallback((value: string, cursorPos: number) => {
    const textBeforeCursor = value.slice(0, cursorPos)

    // Find the last trigger char before the cursor
    let lastTriggerIndex = -1
    let lastTriggerChar: string | null = null
    for (const char of triggerChars) {
      const idx = textBeforeCursor.lastIndexOf(char)
      if (idx > lastTriggerIndex) {
        lastTriggerIndex = idx
        lastTriggerChar = char
      }
    }

    if (lastTriggerChar !== null && lastTriggerIndex >= 0) {
      // Check that the char before the trigger is either start-of-string or a space
      const charBefore = lastTriggerIndex > 0 ? textBeforeCursor[lastTriggerIndex - 1] : " "
      if (charBefore === " " || lastTriggerIndex === 0) {
        const query = textBeforeCursor.slice(lastTriggerIndex + 1)
        // No spaces allowed in the query (closes the trigger)
        if (!query.includes(" ")) {
          setTriggerState({
            isActive: true,
            triggerChar: lastTriggerChar,
            query,
            startIndex: lastTriggerIndex,
          })
          setPopoverOpen(true)
          return
        }
      }
    }

    // No active trigger
    setTriggerState({ isActive: false, triggerChar: null, query: "", startIndex: 0 })
    setPopoverOpen(false)
  }, [triggerChars])

  const handleSelect = useCallback((value: string) => {
    if (!inputRef.current || !triggerState.triggerChar) return
    onSelect(triggerState.triggerChar, value, inputRef.current)
    setTriggerState({ isActive: false, triggerChar: null, query: "", startIndex: 0 })
    setPopoverOpen(false)
  }, [triggerState.triggerChar, onSelect])

  const dismiss = useCallback(() => {
    setTriggerState({ isActive: false, triggerChar: null, query: "", startIndex: 0 })
    setPopoverOpen(false)
  }, [])

  return {
    inputRef,
    triggerState,
    popoverOpen,
    handleInputChange,
    handleSelect,
    dismiss,
  }
}

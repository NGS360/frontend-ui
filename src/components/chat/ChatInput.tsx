import { useState, useCallback } from 'react'
import { SendIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { KeyboardEvent } from 'react'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState('')

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }, [value, disabled, onSend])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  return (
    <div className="flex items-end gap-2 border-t p-3">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about your NGS data..."
        disabled={disabled}
        className="min-h-10 max-h-32 resize-none text-sm"
        rows={1}
        aria-label="Chat message input"
      />
      <Button
        size="icon"
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
      >
        <SendIcon className="size-4" />
      </Button>
    </div>
  )
}

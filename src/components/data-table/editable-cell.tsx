import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface EditableCellProps {
  value: string | undefined
  /**
   * Persist the new value. Receives the trimmed input, or `null` when the
   * input is empty. Must throw / reject on failure so the cell knows to keep
   * edit mode open. Side effects like toasts are the caller's responsibility.
   */
  onSave: (newValue: string | null) => Promise<unknown>
  /**
   * Display-mode content. The caller is responsible for attaching the
   * provided `enterEdit` handler to the clickable element.
   */
  renderDisplay: (props: { enterEdit: () => void }) => ReactNode
  inputClassName?: string
}

export function EditableCell({
  value,
  onSave,
  renderDisplay,
  inputClassName,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [isPending, setIsPending] = useState(false)

  // Reflect upstream value changes (e.g. after a refetch) into the draft
  // while not actively editing.
  useEffect(() => {
    if (!isEditing) setDraft(value ?? '')
  }, [value, isEditing])

  const enterEdit = () => {
    setDraft(value ?? '')
    setIsEditing(true)
  }

  const commit = async () => {
    if (isPending) return
    const trimmed = draft.trim()
    const original = (value ?? '').trim()
    if (trimmed === original) {
      setIsEditing(false)
      return
    }
    setIsPending(true)
    try {
      await onSave(trimmed === '' ? null : trimmed)
      setIsEditing(false)
    } catch {
      // Caller surfaces the error (e.g. via toast). Keep edit mode open
      // so the user can retry or hit Escape.
    } finally {
      setIsPending(false)
    }
  }

  if (isEditing) {
    return (
      <Input
        autoFocus
        value={draft}
        disabled={isPending}
        aria-busy={isPending}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            void commit()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            setDraft(value ?? '')
            setIsEditing(false)
          }
        }}
        className={cn('h-8', inputClassName)}
      />
    )
  }

  return <>{renderDisplay({ enterEdit })}</>
}

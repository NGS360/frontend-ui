import { useCallback, useState } from 'react'
import type { TriggerReference } from '@/components/trigger-input'
import type { Attachment, ContextEntity } from '@/lib/chat-context'
import { usePageContext } from '@/hooks/use-page-context'
import { TYPE_LABELS } from '@/lib/chat-context'

/**
 * What the composer stages: the entity the user is looking at, the entities
 * they typed with "@/#", and any files they attached. Page and reference
 * context is sent with each message; attachments only show as chips.
 */
export function useChatComposerContext() {
  // Dismissal is keyed to the entity id, so navigating elsewhere re-attaches.
  const pageContext = usePageContext()
  const [dismissedContextId, setDismissedContextId] = useState<string | null>(
    null,
  )
  const activeContext: ContextEntity | null =
    pageContext && pageContext.id !== dismissedContextId ? pageContext : null

  // Entities the user referenced via "@/#" in the input, shown as context chips.
  const [references, setReferences] = useState<Array<ContextEntity>>([])
  const addReference = (reference: TriggerReference) => {
    setReferences((prev) =>
      prev.some((r) => r.type === reference.type && r.id === reference.id)
        ? prev
        : [...prev, { ...reference, label: TYPE_LABELS[reference.type] }],
    )
  }
  const removeReference = (entity: ContextEntity) =>
    setReferences((prev) =>
      prev.filter((r) => !(r.type === entity.type && r.id === entity.id)),
    )

  // Files from the paperclip picker or drag-and-drop; any type is allowed.
  const [attachments, setAttachments] = useState<Array<Attachment>>([])
  const addFiles = useCallback((files: Array<File>) => {
    if (files.length === 0) return
    setAttachments((prev) => [
      ...prev,
      ...files.map((file) => ({ id: crypto.randomUUID(), file })),
    ])
  }, [])
  const removeAttachment = (id: string) =>
    setAttachments((prev) => prev.filter((a) => a.id !== id))

  const hasSendableContext = Boolean(activeContext) || references.length > 0

  return {
    activeContext,
    dismissActiveContext: () => {
      if (activeContext) setDismissedContextId(activeContext.id)
    },
    references,
    addReference,
    removeReference,
    attachments,
    addFiles,
    removeAttachment,
    /** Whether the chip row has anything to show. */
    hasContext: hasSendableContext || attachments.length > 0,
    /** The `context` field of the send request, or nothing to send. */
    contextBody: hasSendableContext
      ? {
          context: {
            page: activeContext
              ? { type: activeContext.type, id: activeContext.id }
              : undefined,
            references: references.map((r) => ({ type: r.type, id: r.id })),
          },
        }
      : {},
    /** Unstage everything. A dismissed page context stays dismissed. */
    reset: () => {
      setReferences([])
      setAttachments([])
    },
  }
}

export type ChatComposerContext = ReturnType<typeof useChatComposerContext>

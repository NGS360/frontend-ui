import { z } from 'zod'
import type { useNavigate } from '@tanstack/react-router'

/**
 * Data parts the server streams alongside a reply, consumed via useChat's
 * onData: one-way UI directives from the assistant, and the assigned thread id.
 */

type NavigateFn = ReturnType<typeof useNavigate>

// The API assigns thread ids, so this part is the only way a client learns the
// id of a conversation it just started.
const threadData = z.object({ thread_id: z.string().uuid() })

/**
 * The thread id carried by this part, if it carries one. Validated because it
 * ends up in the URL and in later requests.
 */
export function threadIdFromDataPart(part: {
  type: string
  data?: unknown
}): string | undefined {
  if (part.type !== 'data-thread') return undefined
  const parsed = threadData.safeParse(part.data)
  return parsed.success ? parsed.data.thread_id : undefined
}

// Validates a `data-navigate` payload before we touch the router.
const navigateData = z.object({
  destination: z.enum(['project', 'run', 'job']),
  id: z.string().min(1),
})

/**
 * Act on a UI directive data part, ignoring unknown types and invalid payloads.
 * Navigation maps to a typed route, never a raw string from the model.
 */
export function handleChatDataPart(
  part: { type: string; data?: unknown },
  navigate: NavigateFn,
) {
  if (part.type !== 'data-navigate') return
  const parsed = navigateData.safeParse(part.data)
  if (!parsed.success) return
  const { destination, id } = parsed.data
  switch (destination) {
    case 'project':
      void navigate({ to: '/projects/$project_id', params: { project_id: id } })
      break
    case 'run':
      void navigate({ to: '/runs/$run_id', params: { run_id: id } })
      break
    case 'job':
      void navigate({ to: '/jobs/$job_id', params: { job_id: id } })
      break
  }
}

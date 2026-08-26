import { z } from 'zod'
import type { useNavigate } from '@tanstack/react-router'
import type { Ngs360DataUIPart } from '@/lib/chat-protocol'

/**
 * Data parts the server streams alongside a reply, consumed via useChat's
 * onData: one-way UI directives from the assistant, and the assigned thread id.
 *
 * The part is typed (lib/chat-protocol.ts), so the `type` discrimination below
 * is checked against the parts the server actually emits — a misspelled part
 * name no longer compiles. The zod schemas stay regardless: a type is a
 * compile-time claim about a payload from another process, and both values here
 * reach the router or the URL, so they are validated as values too.
 */

type NavigateFn = ReturnType<typeof useNavigate>

// The API assigns thread ids, so this part is the only way a client learns the
// id of a conversation it just started.
const threadData = z.object({ thread_id: z.string().uuid() })

/**
 * The thread id carried by this part, if it carries one. Validated because it
 * ends up in the URL and in later requests.
 *
 * The object schema is kept rather than reduced to `z.string().uuid()` on
 * `part.data.thread_id`: the type says `data` is an object, the stream does not,
 * and reading a property off a `null` payload throws where a failed parse just
 * ignores the part.
 */
export function threadIdFromDataPart(
  part: Ngs360DataUIPart,
): string | undefined {
  if (part.type !== 'data-thread') return undefined
  const parsed = threadData.safeParse(part.data)
  return parsed.success ? parsed.data.thread_id : undefined
}

// Validates a `data-navigate` payload before we touch the router. This is the
// narrowing that matters and no type can do it: `destination` is a string the
// model chose, and only three values name a route we can navigate to.
const navigateData = z.object({
  destination: z.enum(['project', 'run', 'job']),
  id: z.string().min(1),
})

/**
 * Act on a UI directive data part, ignoring unknown types and invalid payloads.
 * Navigation maps to a typed route, never a raw string from the model.
 *
 * No `data-navigate` part has been observed from the server (see
 * lib/chat-protocol.ts); this is retained for when one is.
 */
export function handleChatDataPart(
  part: Ngs360DataUIPart,
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

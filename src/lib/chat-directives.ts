import { z } from 'zod'
import type { useNavigate } from '@tanstack/react-router'

/**
 * UI directives the assistant streams as data parts (consumed via useChat's
 * onData). Directives are one-way: the browser acts on them and nothing is
 * returned to the model — lighter than a tool call, which is why navigation
 * (and similar fire-and-forget UI actions) use this instead.
 */

type NavigateFn = ReturnType<typeof useNavigate>

// Validates the (untrusted) payload of a `data-navigate` directive before we
// touch the router. Mirrors what the orchestrator emits.
const navigateData = z.object({
  destination: z.enum(['project', 'run', 'job']),
  id: z.string().min(1),
})

/**
 * Act on a UI directive data part. Unknown part types and invalid payloads are
 * ignored. Navigation maps the validated payload to a typed route — never a raw
 * string from the model.
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

import type { UIMessage } from 'ai'
import type { UiMessage } from '@/client'

/**
 * Adapt an API transcript into AI SDK messages so a stored conversation can be
 * replayed in the chat pane. Only text parts survive: tool calls are filtered
 * server-side, and streamed UI directives aren't part of the transcript.
 */
export function toUIMessages(
  messages: Array<UiMessage> | undefined,
): Array<UIMessage> {
  return (messages ?? []).map((message, index) => ({
    // Keep the agent's ids; the index is a fallback for stable React keys.
    id: message.id ?? `restored-${index}`,
    role: message.role === 'user' ? 'user' : 'assistant',
    parts: (message.parts ?? [])
      .filter((part) => part.type === 'text')
      .map((part) => ({ type: 'text' as const, text: part.text ?? '' })),
  }))
}

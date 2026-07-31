import { useChat } from '@ai-sdk/react'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { useChatHistory } from '@/hooks/use-chat-history'
import { ApiError } from '@/lib/api-error'
import { handleChatDataPart, threadIdFromDataPart } from '@/lib/chat-directives'
import { toUIMessages } from '@/lib/chat-messages'
import { chatTransport } from '@/lib/chat-transport'

/**
 * The conversation in the chat pane: its messages, its stream, and which thread
 * it belongs to. Wraps useChat with the bookkeeping server-assigned thread ids
 * require.
 */

// Max cadence (ms) for flushing streamed tokens to a render. Without it, a
// proxy-buffered burst of SSE chunks fires enough synchronous renders to trip
// React's update-depth guard and abort the stream mid-reply.
const STREAM_RENDER_INTERVAL_MS = 50

export function useChatConversation() {
  const navigate = useNavigate()
  const history = useChatHistory()

  // The thread id assigned this turn, captured mid-stream and applied on finish
  // so navigation doesn't churn during the stream.
  const assignedThreadRef = useRef<string | null>(null)
  // The thread already hydrated into the pane, so a late response can't replay
  // over messages the user has since added.
  const hydratedIdRef = useRef<string | null>(null)

  // No `id` is passed, so the pane isn't re-keyed (which would wipe it) when a
  // new conversation learns its id partway through the first reply.
  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    error,
    regenerate,
  } = useChat({
    transport: chatTransport,
    experimental_throttle: STREAM_RENDER_INTERVAL_MS,
    // Data parts carry the assistant's UI directives and the assigned thread id.
    onData: (part) => {
      const assigned = threadIdFromDataPart(part)
      if (assigned) assignedThreadRef.current = assigned
      handleChatDataPart(part, navigate)
    },
    onFinish: () => {
      const assigned = assignedThreadRef.current
      assignedThreadRef.current = null
      // The thread exists server-side now, so list it and make it the open one.
      void history.threadsQuery.refetch()
      if (assigned && assigned !== history.threadId) {
        // Already on screen — don't let the transcript query replace it.
        hydratedIdRef.current = assigned
        history.openThread(assigned)
      }
    },
  })

  // Only the transcript is persisted, and only server-side: opening a
  // conversation fills the pane from the API when its transcript arrives.
  useEffect(() => {
    const transcript = history.transcriptQuery.data
    // A response can land after the user has moved on.
    if (!transcript || transcript.thread_id !== history.threadId) return
    // Once per thread, or this would wipe turns added since it loaded.
    if (hydratedIdRef.current === transcript.thread_id) return
    hydratedIdRef.current = transcript.thread_id
    setMessages(toUIMessages(transcript.messages))
  }, [history.transcriptQuery.data, history.threadId, setMessages])

  // The chat instance is never re-keyed, so the pane is cleared explicitly.
  const showThread = (id: string | undefined) => {
    // Re-picking the open conversation would clear the pane without
    // re-running the hydration effect, since nothing it depends on changes.
    if (id !== undefined && id === history.threadId) return
    hydratedIdRef.current = null
    setMessages([])
    history.openThread(id)
  }

  // The stored thread can be gone — deleted from another tab, or expired. Its
  // transcript 404s, and sending to it would 404 too, so fall back to a new
  // chat rather than leaving a pane that can't recover.
  //
  // Only on 404. A 502 means the agent upstream is unreachable, which is
  // transient; discarding the thread then would lose a conversation that is
  // still there once it recovers.
  useEffect(() => {
    const transcriptError = history.transcriptQuery.error
    if (transcriptError instanceof ApiError && transcriptError.status === 404) {
      showThread(undefined)
    }
  }, [history.transcriptQuery.error])

  const threads = history.threadsQuery.data?.data ?? []
  const hasMessages = messages.length > 0

  return {
    messages,
    status,
    error,
    isBusy: status === 'submitted' || status === 'streaming',
    hasMessages,
    sendMessage,
    stop,
    regenerate,

    threads,
    isLoadingThreads: history.threadsQuery.isLoading,
    isErrorThreads: history.threadsQuery.isError,
    threadId: history.threadId,
    // Titles are derived server-side and only arrive with the thread list, so a
    // new chat has none until its first reply refetches that list.
    activeTitle: threads.find((t) => t.id === history.threadId)?.title,
    // Distinguishes a fetching pane from an empty one, so the "How can I help?"
    // prompt doesn't flash on a conversation that does have messages.
    isLoadingTranscript: !hasMessages && history.transcriptQuery.isLoading,

    /** Show a thread in the pane; pass undefined to start a new chat. */
    showThread,
    deleteThread: (id: string) =>
      history.deleteThread.mutate({ path: { thread_id: id } }),
    deleteAllThreads: () => history.deleteAllThreads.mutate({}),
  }
}

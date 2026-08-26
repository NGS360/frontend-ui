import { useChat } from '@ai-sdk/react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import type { Ngs360UIMessage } from '@/lib/chat-protocol'
import { getChatThreadMessagesQueryKey } from '@/client/@tanstack/react-query.gen'
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
  const queryClient = useQueryClient()

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
  } = useChat<Ngs360UIMessage>({
    transport: chatTransport,
    experimental_throttle: STREAM_RENDER_INTERVAL_MS,
    // Data parts carry the assistant's UI directives and the assigned thread id.
    // Parameterising useChat types `part` as one of this app's own data parts
    // (lib/chat-protocol.ts) rather than an open `data-${string}`.
    onData: (part) => {
      const assigned = threadIdFromDataPart(part)
      if (assigned) assignedThreadRef.current = assigned
      handleChatDataPart(part, navigate)
    },
    onFinish: ({ isAbort }) => {
      const assigned = assignedThreadRef.current
      assignedThreadRef.current = null
      // The thread exists server-side now, so list it and make it the open one.
      void history.threadsQuery.refetch()
      const turnThreadId = assigned ?? history.threadId
      if (turnThreadId) {
        // Any cached transcript for this thread predates the turn that just
        // finished. Drop the entry outright: invalidating would only mark it
        // stale and leave the data in place, and that data is exactly what
        // react-query hands back on the next open, one turn short.
        queryClient.removeQueries({
          queryKey: getChatThreadMessagesQueryKey({
            path: { thread_id: turnThreadId },
          }),
        })
        // The pane is authoritative for this thread now: it holds the turn that
        // just streamed, and a transcript is only the text-only projection of
        // that. Latch so no refetch replays over it — unless the user walked
        // away mid-stream, in which case the pane holds their new chat and
        // latching it to the abandoned thread would block that one hydrating.
        if (!isAbort) hydratedIdRef.current = turnThreadId
      }
      // Opening the assigned thread is for the case this turn CREATED it. If
      // the user started a new chat while it was still streaming, they have
      // already chosen where to be, and this would drag them back.
      if (!isAbort && assigned && assigned !== history.threadId) {
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
    // Once the pane holds this thread's own copy, leave it alone: replaying the
    // transcript over it would wipe turns added since it loaded.
    if (hydratedIdRef.current === transcript.thread_id) return
    // A stream owns the pane while it runs, and no transcript can know about the
    // turn being written. Latch rather than just skipping, so a payload landing
    // later in the same turn can't replay over the reply either.
    if (status === 'submitted' || status === 'streaming') {
      hydratedIdRef.current = transcript.thread_id
      return
    }
    // Reopening a thread is served from cache in the same render that starts the
    // refetch. Show that copy — it's the whole conversation bar at most the last
    // turn — but don't latch on it: latching on a read with a fetch still behind
    // it is what discarded the complete transcript that followed.
    if (!history.transcriptQuery.isFetching) {
      hydratedIdRef.current = transcript.thread_id
    }
    setMessages(toUIMessages(transcript.messages))
  }, [
    history.transcriptQuery.data,
    history.transcriptQuery.isFetching,
    history.threadId,
    setMessages,
    status,
  ])

  // The chat instance is never re-keyed, so the pane is cleared explicitly.
  const showThread = (id: string | undefined) => {
    // Re-picking the open conversation would clear the pane without
    // re-running the hydration effect, since nothing it depends on changes.
    if (id !== undefined && id === history.threadId) return
    // A stream in flight belongs to the thread being left, not the one being
    // opened. Without this it keeps running against a cleared pane, and its
    // reply lands wherever the user has since navigated.
    if (status === 'submitted' || status === 'streaming') void stop()
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

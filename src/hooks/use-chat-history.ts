import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  deleteAllChatThreadsMutation,
  deleteChatThreadMutation,
  getChatThreadMessagesOptions,
  listChatThreadsOptions,
} from '@/client/@tanstack/react-query.gen'
import { toastApiError } from '@/lib/error-utils'
import { useAiChatThreadStore } from '@/stores/ai-chat-thread-store'

/**
 * AI chat history: the caller's threads, and which one is open.
 *
 * Threads live entirely server-side — the API assigns ids, derives titles, and
 * rebuilds transcripts — and they're owner-scoped, so a thread id is only ever
 * meaningful to the user it belongs to. Which one is open is therefore local
 * state, kept per-tab in [useAiChatThreadStore].
 *
 * Queries and mutations are returned unflattened so callers keep `isFetching`,
 * `error`, `refetch` and `isPending`.
 */

const THREADS_PER_PAGE = 30

export function useChatHistory() {
  // Undefined means "a new chat that hasn't been saved yet".
  const threadId = useAiChatThreadStore((s) => s.threadId)
  const openThread = useAiChatThreadStore((s) => s.openThread)

  const threadsQuery = useQuery({
    ...listChatThreadsOptions({ query: { skip: 0, limit: THREADS_PER_PAGE } }),
    placeholderData: keepPreviousData,
  })

  // Only an existing thread has messages to fetch.
  const transcriptQuery = useQuery({
    ...getChatThreadMessagesOptions({ path: { thread_id: threadId ?? '' } }),
    enabled: Boolean(threadId),
  })

  // refetch, not invalidateQueries: this hook is the list's only observer.
  // Switch to invalidating the key if a second view ever lists threads.
  const deleteThread = useMutation({
    ...deleteChatThreadMutation(),
    onSuccess: () => threadsQuery.refetch(),
    onError: (error) => toastApiError(error, 'Failed to delete conversation'),
  })

  const deleteAllThreads = useMutation({
    ...deleteAllChatThreadsMutation(),
    onSuccess: () => {
      toast.success('Chat history cleared')
      return threadsQuery.refetch()
    },
    onError: (error) => toastApiError(error, 'Failed to clear chat history'),
  })

  return {
    threadsQuery,
    transcriptQuery,
    deleteThread,
    deleteAllThreads,
    /** The open thread, or undefined for a chat with no messages yet. */
    threadId,
    /** Show a thread; pass undefined to start a new chat. */
    openThread,
  }
}

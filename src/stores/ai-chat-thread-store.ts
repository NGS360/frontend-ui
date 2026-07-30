import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface AiChatThreadStore {
  /** The open conversation, or undefined for a new chat. */
  threadId: string | undefined

  /** Open a thread; pass undefined to start a new chat. */
  openThread: (id: string | undefined) => void
}

/**
 * Which AI chat thread is open, persisted to sessionStorage.
 *
 * sessionStorage rather than localStorage because it is per-tab: a reload keeps
 * the conversation, two tabs hold different ones, and nothing carries over to
 * the next person to sign in on a shared machine.
 */
export const useAiChatThreadStore = create<AiChatThreadStore>()(
  persist(
    (set) => ({
      threadId: undefined,
      openThread: (id: string | undefined) => set({ threadId: id }),
    }),
    {
      name: 'ngs360-chat-thread',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)

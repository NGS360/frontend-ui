import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AiChatTipStore {
  /**
   * Usernames that have dismissed the AI Assistant intro tip, so the tip
   * follows the signed-in profile even when accounts share a browser
   */
  dismissedBy: Record<string, boolean>

  /**
   * Whether the given user has dismissed the tip
   * @param username - The current user's username
   */
  isDismissed: (username: string) => boolean

  /**
   * Permanently dismiss the tip for the given user
   * @param username - The current user's username
   */
  dismiss: (username: string) => void
}

/**
 * Zustand store tracking dismissal of the AI Assistant intro tip,
 * persisted to localStorage so the tip never reappears once dismissed
 */
export const useAiChatTipStore = create<AiChatTipStore>()(
  persist(
    (set, get) => ({
      dismissedBy: {},

      isDismissed: (username: string) => {
        return Boolean(get().dismissedBy[username])
      },

      dismiss: (username: string) => {
        set((state) => ({
          dismissedBy: { ...state.dismissedBy, [username]: true },
        }))
      },
    }),
    { name: 'ngs360-ai-chat-tip' },
  ),
)

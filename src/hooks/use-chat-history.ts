import { useCallback, useEffect, useRef, useState } from 'react'
import type { UIMessage } from 'ai'

/**
 * Front-end mock of AI chat conversation history.
 *
 * Conversations are persisted to localStorage so the History panel works
 * end-to-end without a backend. This hook is the single seam for that storage:
 * when the server grows real conversation endpoints, swap the load/persist
 * helpers here for API calls and the UI keeps working unchanged.
 */

export interface ChatConversation {
  id: string
  title: string
  messages: Array<UIMessage>
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'ngs360.ai-chat.history.v1'
const TITLE_MAX_LENGTH = 48

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `chat-${Date.now()}-${Math.round(Math.random() * 1e6)}`

const firstText = (message: UIMessage): string => {
  for (const part of message.parts) {
    if (part.type === 'text' && part.text.trim()) return part.text.trim()
  }
  return ''
}

export const deriveTitle = (messages: Array<UIMessage>): string => {
  const firstUser = messages.find((m) => m.role === 'user')
  const text = firstUser ? firstText(firstUser) : ''
  if (!text) return 'New chat'
  return text.length > TITLE_MAX_LENGTH
    ? `${text.slice(0, TITLE_MAX_LENGTH).trimEnd()}…`
    : text
}

const sameMessages = (a: Array<UIMessage>, b: Array<UIMessage>): boolean =>
  a.length === b.length && a[a.length - 1]?.id === b[b.length - 1]?.id

const load = (): Array<ChatConversation> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Array<ChatConversation>
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const persist = (conversations: Array<ChatConversation>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
  } catch {
    // Storage full or unavailable (private mode) — history is best-effort.
  }
}

export interface UseChatHistory {
  conversations: Array<ChatConversation>
  activeId: string
  setActiveId: (id: string) => void
  /** Persist the live messages under the active conversation (no-op if empty). */
  upsertActive: (messages: Array<UIMessage>) => void
  /** Begin a fresh conversation, leaving the current one in history. */
  startNewChat: () => void
  /** Drop a conversation from history. */
  removeConversation: (id: string) => void
  /** Wipe the active conversation from history (its messages are discarded). */
  clearActive: () => void
  /** Remove every conversation from history. */
  clearAll: () => void
}

export function useChatHistory(): UseChatHistory {
  const [conversations, setConversations] = useState<Array<ChatConversation>>(load)
  const [activeId, setActiveId] = useState<string>(newId)

  // Keep a ref so upsertActive stays referentially stable across renders.
  const activeIdRef = useRef(activeId)
  activeIdRef.current = activeId

  useEffect(() => {
    persist(conversations)
  }, [conversations])

  const upsertActive = useCallback((messages: Array<UIMessage>) => {
    if (messages.length === 0) return
    const id = activeIdRef.current
    setConversations((prev) => {
      const existing = prev.find((c) => c.id === id)
      if (existing && sameMessages(existing.messages, messages)) return prev
      const now = Date.now()
      const next: ChatConversation = {
        id,
        title: deriveTitle(messages),
        messages,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }
      return [next, ...prev.filter((c) => c.id !== id)]
    })
  }, [])

  const startNewChat = useCallback(() => {
    setActiveId(newId())
  }, [])

  const removeConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const clearActive = useCallback(() => {
    const id = activeIdRef.current
    setConversations((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setConversations([])
  }, [])

  // Most-recently-updated first.
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt)

  return {
    conversations: sorted,
    activeId,
    setActiveId,
    upsertActive,
    startNewChat,
    removeConversation,
    clearActive,
    clearAll,
  }
}

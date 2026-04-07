import { useState, useCallback, useRef, useEffect } from 'react'
import { STORAGE_KEYS } from '@/context/auth-context'

const API_URL = import.meta.env.VITE_API_URL

const CHAT_CONVERSATION_KEY = 'chat_conversation_id'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface UseChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  sendMessage: (text: string) => Promise<void>
  startNewConversation: () => void
  conversationId: string | null
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(() =>
    localStorage.getItem(CHAT_CONVERSATION_KEY),
  )
  const abortRef = useRef<AbortController | null>(null)

  // Persist conversation ID to localStorage
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem(CHAT_CONVERSATION_KEY, conversationId)
    } else {
      localStorage.removeItem(CHAT_CONVERSATION_KEY)
    }
  }, [conversationId])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      if (!token) return

      // Add user message
      const userMsg: ChatMessage = {
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, userMsg])
      setIsLoading(true)

      // Placeholder assistant message for streaming
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, assistantMsg])

      abortRef.current = new AbortController()

      try {
        const res = await fetch(`${API_URL}/api/v1/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: trimmed,
            conversation_id: conversationId,
            stream: true,
          }),
          signal: abortRef.current.signal,
        })

        if (!res.ok) {
          const status = res.status
          let errorText = 'Something went wrong. Please try again.'
          if (status === 503) errorText = 'AI service is temporarily unavailable.'
          else if (status === 504) errorText = 'Request timed out. Please try again.'
          else if (status === 401) errorText = 'Session expired. Please log in again.'

          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              role: 'assistant',
              content: errorText,
              timestamp: Date.now(),
            }
            return updated
          })
          setIsLoading(false)
          return
        }

        const reader = res.body?.getReader()
        if (!reader) {
          setIsLoading(false)
          return
        }

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const payload = JSON.parse(line.slice(6))

                // Capture conversation_id from first event
                if (payload.conversation_id && !conversationId) {
                  setConversationId(payload.conversation_id)
                }

                if (payload.data) {
                  setMessages((prev) => {
                    const updated = [...prev]
                    const last = updated[updated.length - 1]
                    if (last) {
                      updated[updated.length - 1] = {
                        ...last,
                        content: last.content + payload.data,
                      }
                    }
                    return updated
                  })
                  // First chunk received — no longer "loading"
                  setIsLoading(false)
                }
              } catch {
                // Ignore malformed JSON lines
              }
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return

        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: 'Something went wrong. Please try again.',
            timestamp: Date.now(),
          }
          return updated
        })
      } finally {
        setIsLoading(false)
        abortRef.current = null
      }
    },
    [conversationId, isLoading],
  )

  const startNewConversation = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setConversationId(null)
    setIsLoading(false)
  }, [])

  return { messages, isLoading, sendMessage, startNewConversation, conversationId }
}

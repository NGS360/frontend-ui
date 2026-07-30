import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatStatus, UIMessage } from 'ai'
import { AiChatEmptyState } from '@/components/ai-chat/empty-state'
import { AiChatMarkdown } from '@/components/ai-chat/markdown'
import { ContainedSpinner, Spinner } from '@/components/spinner'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

/**
 * The scrolling transcript: the turns themselves plus the states around them
 * (loading a transcript, an empty conversation, a pending reply, a failure).
 * Owns its own scroll position and edge fades.
 */
export function AiChatMessages({
  messages,
  status,
  error,
  isLoadingTranscript,
  onRetry,
  onSuggestion,
  centered,
}: {
  messages: Array<UIMessage>
  status: ChatStatus
  error: Error | undefined
  isLoadingTranscript: boolean
  onRetry: () => void
  onSuggestion: (prompt: string) => void
  /** Fullscreen keeps the conversation at a readable width. */
  centered: boolean
}) {
  const centeredClass = centered ? 'mx-auto w-full max-w-3xl' : ''
  const isBusy = status === 'submitted' || status === 'streaming'

  const messagesEndRef = useRef<HTMLDivElement>(null)
  // Edge fades, shown only where there's scrolled-past content.
  const messagesScrollRef = useRef<HTMLDivElement>(null)
  const [atTop, setAtTop] = useState(true)
  const [atBottom, setAtBottom] = useState(true)
  const recomputeFades = useCallback(() => {
    const el = messagesScrollRef.current
    if (!el) return
    const threshold = 4
    setAtTop(el.scrollTop <= threshold)
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight <= threshold)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' })
    recomputeFades()
  }, [messages, centered, recomputeFades])

  // Recompute on container resize (sidebar drag, fullscreen toggle, viewport).
  useEffect(() => {
    const el = messagesScrollRef.current
    if (!el) return
    const observer = new ResizeObserver(() => recomputeFades())
    observer.observe(el)
    recomputeFades()
    return () => observer.disconnect()
  }, [recomputeFades, centered])

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <ScrollArea
        className="min-h-0 flex-1"
        viewportRef={messagesScrollRef}
        viewportProps={{
          id: 'ai-chat-messages',
          onScroll: recomputeFades,
          // overscroll-contain stops scroll chaining to the page at the ends.
          // [&>div] overrides Radix's display:table wrapper so the empty state
          // can center vertically.
          className:
            'overscroll-contain [&>div]:!flex [&>div]:min-h-full [&>div]:flex-col',
        }}
      >
        <div className="flex flex-1 flex-col p-4">
          {isLoadingTranscript ? (
            <div
              id="ai-chat-transcript-loading"
              className={cn(
                'flex flex-1 items-center justify-center',
                centeredClass,
              )}
              aria-busy
            >
              <ContainedSpinner variant="ellipsis" />
            </div>
          ) : messages.length === 0 ? (
            <AiChatEmptyState
              disabled={isBusy}
              onSelect={onSuggestion}
              className={centeredClass}
            />
          ) : (
            <div className={cn('flex flex-col gap-3', centeredClass)}>
              {messages.map((message, messageIndex) => {
                // Only the trailing assistant message can be mid-stream. The rest
                // are final, so Streamdown's memo bails on content identity.
                const isStreaming =
                  status === 'streaming' &&
                  message.role === 'assistant' &&
                  messageIndex === messages.length - 1
                return (
                  <div
                    key={message.id}
                    data-role={message.role}
                    // Assistant bubbles are full-column: a shrink-to-fit box
                    // around an overflow-x:auto table collapses to a sliver.
                    className="min-w-0 rounded-lg px-3 py-2 text-sm data-[role=assistant]:w-full data-[role=assistant]:self-start data-[role=assistant]:bg-muted data-[role=user]:max-w-[85%] data-[role=user]:self-end data-[role=user]:bg-primary data-[role=user]:whitespace-pre-wrap data-[role=user]:text-primary-foreground"
                  >
                    {message.parts.map((part, index) => {
                      if (part.type !== 'text') return null
                      // A user's literal "*" or "#" stays literal.
                      return message.role === 'assistant' ? (
                        <AiChatMarkdown
                          key={index}
                          isStreaming={isStreaming}
                          text={part.text}
                        />
                      ) : (
                        <span key={index}>{part.text}</span>
                      )
                    })}
                  </div>
                )
              })}
              {status === 'submitted' && (
                <div className="flex max-w-[85%] items-center gap-2 self-start rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <Spinner variant="circle" size={14} />
                  Thinking…
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 self-start text-sm text-destructive">
                  <span>Something went wrong.</span>
                  <Button
                    id="ai-chat-retry"
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                  >
                    Retry
                  </Button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>
      {/* Hidden at the true top/bottom so the first/last message isn't dimmed. */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-background to-transparent transition-opacity duration-200',
          atTop ? 'opacity-0' : 'opacity-100',
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent transition-opacity duration-200',
          atBottom ? 'opacity-0' : 'opacity-100',
        )}
      />
    </div>
  )
}

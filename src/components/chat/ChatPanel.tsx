import { useEffect, useRef } from 'react'
import { SquarePenIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/spinner'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { useChat } from './use-chat'

export function ChatPanel() {
  const { messages, isLoading, sendMessage, startNewConversation } = useChat()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-medium">NGS360 Assistant</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={startNewConversation}
          aria-label="New conversation"
        >
          <SquarePenIcon className="size-4" />
          <span className="ml-1">New</span>
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="flex flex-col gap-3 p-4">
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              Ask me anything about your projects, runs, samples, or workflows.
            </p>
          )}
          {messages.map((msg, i) => (
            <ChatMessage key={`${msg.timestamp}-${i}`} message={msg} />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-muted px-3 py-2">
                <Spinner variant="ellipsis" size={20} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  )
}

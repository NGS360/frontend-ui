import { useChat } from '@ai-sdk/react'
import {
  PanelRightClose,
  PanelRightOpen,
  Send,
  Sparkles,
  Square,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { chatTransport } from '@/lib/chat-transport'
import { cn } from '@/lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const MIN_WIDTH = 240
const MIN_CONTENT_WIDTH = 480
const DEFAULT_WIDTH = 384

const clampWidth = (w: number) => {
  const max = Math.max(MIN_WIDTH, window.innerWidth - MIN_CONTENT_WIDTH)
  return Math.max(MIN_WIDTH, Math.min(max, w))
}

export function AiChatSidebarProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [isResizing, setIsResizing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [input, setInput] = useState('')
  const resizingRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, stop, error, regenerate } = useChat({
    transport: chatTransport,
  })
  const isBusy = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, isExpanded])

  const handleSend = () => {
    const content = input.trim()
    if (!content || isBusy) return
    void sendMessage({ text: content })
    setInput('')
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizingRef.current) return
      setWidth(clampWidth(window.innerWidth - e.clientX))
    }
    const onUp = () => {
      if (!resizingRef.current) return
      resizingRef.current = false
      setIsResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    const onWindowResize = () => setWidth((w) => clampWidth(w))
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('resize', onWindowResize)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('resize', onWindowResize)
    }
  }, [])

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isExpanded) setIsExpanded(false)
    resizingRef.current = true
    setIsResizing(true)
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
  }

  // In fullscreen mode, keep the conversation at a readable width
  const centeredClass = isExpanded ? 'mx-auto w-full max-w-3xl' : ''

  const panel = (
    <>
      <SidebarHeader className="flex-row items-center gap-2 h-14 py-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              id="ai-sidebar-expand-toggle"
              variant="ghost"
              size="icon"
              aria-label={
                isExpanded
                  ? 'Collapse AI sidebar'
                  : 'Expand AI sidebar to full width'
              }
              aria-pressed={isExpanded}
              onClick={() => setIsExpanded((v) => !v)}
            >
              {isExpanded ? (
                <PanelRightClose className="h-5 w-5" />
              ) : (
                <PanelRightOpen className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isExpanded ? 'Collapse panel' : 'Expand panel'}
          </TooltipContent>
        </Tooltip>
        <span className="text-lg font-semibold">AI Assistant</span>
      </SidebarHeader>
      <SidebarContent id="ai-chat-messages" className="p-4">
        {messages.length === 0 ? (
          <div
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-2 text-center',
              centeredClass,
            )}
          >
            <Sparkles className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">How can I help?</p>
            <p className="text-sm text-muted-foreground">
              Ask a question about your projects, runs, or samples.
            </p>
          </div>
        ) : (
          <div className={cn('flex flex-col gap-3', centeredClass)}>
            {messages.map((message) => (
              <div
                key={message.id}
                data-role={message.role}
                className="max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap data-[role=assistant]:self-start data-[role=assistant]:bg-muted data-[role=user]:self-end data-[role=user]:bg-primary data-[role=user]:text-primary-foreground"
              >
                {message.parts.map((part, index) =>
                  part.type === 'text' ? (
                    <span key={index}>{part.text}</span>
                  ) : null,
                )}
              </div>
            ))}
            {status === 'submitted' && (
              <div className="max-w-[85%] animate-pulse self-start rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
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
                  onClick={() => void regenerate()}
                >
                  Retry
                </Button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </SidebarContent>
      <SidebarFooter className="px-3 py-3">
        <form
          id="ai-chat-form"
          className={cn('flex items-end gap-2', centeredClass)}
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
        >
          <Textarea
            id="ai-chat-input"
            placeholder="Ask anything..."
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="max-h-40 min-h-0 flex-1 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                e.currentTarget.form?.requestSubmit()
              }
            }}
          />
          {isBusy ? (
            <Button
              id="ai-chat-stop"
              type="button"
              size="icon"
              variant="outline"
              aria-label="Stop generating"
              onClick={() => void stop()}
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              id="ai-chat-send"
              type="submit"
              size="icon"
              aria-label="Send"
              disabled={!input.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          )}
        </form>
      </SidebarFooter>
    </>
  )

  return (
    <SidebarProvider
      defaultOpen={false}
      style={{ '--sidebar-width': `${width}px` } as React.CSSProperties}
    >
      <div className="flex min-h-svh min-w-0 flex-1 flex-col">{children}</div>
      <Sidebar
        id="ai-sidebar"
        side="right"
        collapsible="offcanvas"
        className="bg-background"
      >
        {!isExpanded && (
          <>
            <div
              id="ai-sidebar-resize-handle"
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize AI sidebar"
              onMouseDown={startResize}
              data-resizing={isResizing}
              className="absolute inset-y-0 left-0 z-30 hidden w-1 cursor-ew-resize transition-colors duration-0 hover:bg-primary hover:delay-500 data-[resizing=true]:bg-primary md:block"
            />
            {panel}
          </>
        )}
      </Sidebar>
      {isExpanded &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            id="ai-sidebar-fullscreen"
            className="bg-background text-foreground fixed inset-0 z-50 flex flex-col"
          >
            {panel}
          </div>,
          document.body,
        )}
    </SidebarProvider>
  )
}

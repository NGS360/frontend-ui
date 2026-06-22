import { useChat } from '@ai-sdk/react'
import { useNavigate } from '@tanstack/react-router'
import {
  Briefcase,
  History,
  MoreHorizontal,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Send,
  Sparkles,
  Square,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { TriggerReference } from '@/components/trigger-input'
import { ChatHistoryList } from '@/components/ai-chat-history-list'
import { ResizeHandle } from '@/components/resize-handle'
import { TriggerTextarea } from '@/components/trigger-input'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { useChatHistory } from '@/hooks/use-chat-history'
import { useDragResize } from '@/hooks/use-drag-resize'
import { usePageContext } from '@/hooks/use-page-context'
import { handleChatDataPart } from '@/lib/chat-directives'
import { chatTransport } from '@/lib/chat-transport'
import { entityMeta } from '@/lib/entity-icons'
import { cn } from '@/lib/utils'
import {
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
} from '@/components/ui/sidebar'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const MIN_WIDTH = 240
const MIN_CONTENT_WIDTH = 480
const DEFAULT_WIDTH = 384
// In mobile mode the panel overlays the page instead of pushing it, so it
// ignores the resizable width and its content-preserving clamp.
const MOBILE_WIDTH = '100vw'

const clampWidth = (w: number, viewport: number) => {
  const max = Math.max(MIN_WIDTH, viewport - MIN_CONTENT_WIDTH)
  return Math.max(MIN_WIDTH, Math.min(max, w))
}

// Below this docked width the toolbar actions collapse into an overflow menu.
const TOOLBAR_COLLAPSE_WIDTH = 360

// Starter prompts shown above the input when a conversation is empty.
const SUGGESTED_PROMPTS = [
  'Which runs failed QC recently?',
  'Summarize a project',
  'Find samples missing manifests',
]

// An entity attached to the chat as context: the page the user is on, or an
// "@/#" reference they typed into the input.
type ContextEntity = {
  type: 'project' | 'run' | 'sample' | 'job' | 'user'
  id: string
  label: string
}

const TYPE_LABELS: Record<ContextEntity['type'], string> = {
  project: 'Project',
  run: 'Run',
  sample: 'Sample',
  job: 'Job',
  user: 'User',
}

// Fullscreen left rail (history panel) resize bounds.
const RAIL_MIN_WIDTH = 200
const RAIL_MAX_WIDTH = 420
const RAIL_DEFAULT_WIDTH = 256
const RAIL_MIN_CHAT_WIDTH = 360

const clampRailWidth = (w: number, viewport: number) => {
  const max = Math.min(RAIL_MAX_WIDTH, viewport - RAIL_MIN_CHAT_WIDTH)
  return Math.max(RAIL_MIN_WIDTH, Math.min(Math.max(RAIL_MIN_WIDTH, max), w))
}

export function AiChatSidebarProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // Single open state shared by the desktop sidebar and the mobile sheet, so
  // the panel stays open (or closed) when the viewport crosses the breakpoint.
  const [open, setOpen] = useState(false)
  // The width the user chose by dragging. Never clamped in place — the
  // rendered width is derived below, so shrinking the window doesn't
  // permanently lose the preferred width.
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [railWidth, setRailWidth] = useState(RAIL_DEFAULT_WIDTH)
  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth)
  const isMobile = useIsMobile()
  const [isExpanded, setIsExpanded] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const effectiveWidth = clampWidth(width, windowWidth)
  const effectiveRailWidth = clampRailWidth(railWidth, windowWidth)
  // Fullscreen expand only exists on desktop; the mobile sheet is already
  // full width, and an orphaned Sheet behind the fullscreen portal would
  // render as a blank layer.
  const expanded = isExpanded && !isMobile

  // Drag-to-resize: the docked sidebar grows from the right edge of the
  // viewport; the fullscreen rail grows from the left edge of its container.
  const sidebarResize = useDragResize((e) =>
    setWidth(clampWidth(window.innerWidth - e.clientX, window.innerWidth)),
  )
  const railResize = useDragResize((e) =>
    setRailWidth(clampRailWidth(e.clientX, window.innerWidth)),
  )

  // Slide the sheet in only when the user opens it. When it appears because
  // the viewport crossed into mobile while the chat was already open, the
  // panel should swap presentation silently instead of animating in.
  const [animateSheet, setAnimateSheet] = useState(true)
  const [prevIsMobile, setPrevIsMobile] = useState(isMobile)
  const [prevOpen, setPrevOpen] = useState(open)
  if (prevIsMobile !== isMobile) {
    setPrevIsMobile(isMobile)
    if (isMobile && open) setAnimateSheet(false)
  }
  if (prevOpen !== open) {
    setPrevOpen(open)
    setAnimateSheet(true)
  }

  // Closing the chat exits fullscreen mode, so it always reopens docked.
  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) setIsExpanded(false)
  }

  const navigate = useNavigate()
  const { messages, setMessages, sendMessage, status, stop, error, regenerate } =
    useChat({
      transport: chatTransport,
      // The assistant drives UI actions by streaming data-part directives
      // (e.g. data-navigate); we act on them here. These are one-way — nothing
      // is returned to the model — so there's no tool lifecycle to manage.
      onData: (part) => handleChatDataPart(part, navigate),
    })
  const isBusy = status === 'submitted' || status === 'streaming'

  const history = useChatHistory()
  const [historyOpen, setHistoryOpen] = useState(false)
  const [overflowOpen, setOverflowOpen] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmClearAll, setConfirmClearAll] = useState(false)

  const closeMenus = () => {
    setHistoryOpen(false)
    setOverflowOpen(false)
  }

  // Context from the page the user is on (e.g. a project or run). Shown in the
  // composer and sent with each message. The user can detach it; dismissing is
  // keyed to the entity id, so navigating to a different entity re-attaches.
  const pageContext = usePageContext()
  const [dismissedContextId, setDismissedContextId] = useState<string | null>(null)
  const activeContext: ContextEntity | null =
    pageContext && pageContext.id !== dismissedContextId ? pageContext : null

  // Entities the user referenced via "@/#" in the input, shown as context chips.
  const [references, setReferences] = useState<Array<ContextEntity>>([])
  const handleReference = (reference: TriggerReference) => {
    setReferences((prev) =>
      prev.some((r) => r.type === reference.type && r.id === reference.id)
        ? prev
        : [...prev, { ...reference, label: TYPE_LABELS[reference.type] }],
    )
  }
  const removeReference = (entity: ContextEntity) =>
    setReferences((prev) =>
      prev.filter((r) => !(r.type === entity.type && r.id === entity.id)),
    )

  const hasContext = Boolean(activeContext) || references.length > 0
  const requestOptions = hasContext
    ? {
        body: {
          context: {
            page: activeContext
              ? { type: activeContext.type, id: activeContext.id }
              : undefined,
            references: references.map((r) => ({ type: r.type, id: r.id })),
          },
        },
      }
    : undefined

  // Persist the conversation once it settles (avoids saving on every token).
  useEffect(() => {
    if (isBusy) return
    history.upsertActive(messages)
  }, [messages, isBusy, history])

  const handleNewChat = () => {
    history.startNewChat()
    setMessages([])
    setInput('')
    setReferences([])
    closeMenus()
  }

  const handleSelectChat = (id: string) => {
    const conversation = history.conversations.find((c) => c.id === id)
    if (!conversation) return
    history.setActiveId(id)
    setMessages(conversation.messages)
    closeMenus()
  }

  const handleDeleteChat = (id: string) => {
    history.removeConversation(id)
    if (id === history.activeId) {
      history.startNewChat()
      setMessages([])
      setReferences([])
    }
  }

  const handleClearChat = () => {
    history.clearActive()
    setMessages([])
    setInput('')
    setReferences([])
    setConfirmClear(false)
  }

  const handleClearAllHistory = () => {
    history.clearAll()
    history.startNewChat()
    setMessages([])
    setInput('')
    setReferences([])
    setConfirmClearAll(false)
  }

  // Edge fades on the message list: shown only when there's scrolled-past
  // content in that direction (no fade at the true top/bottom).
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
  }, [messages, expanded, recomputeFades])

  // Recompute on container resize (sidebar drag, fullscreen toggle, viewport).
  useEffect(() => {
    const el = messagesScrollRef.current
    if (!el) return
    const observer = new ResizeObserver(() => recomputeFades())
    observer.observe(el)
    recomputeFades()
    return () => observer.disconnect()
  }, [recomputeFades, expanded])

  const handleSend = () => {
    const content = input.trim()
    if (!content || isBusy) return
    void sendMessage({ text: content }, requestOptions)
    setInput('')
    setReferences([])
  }

  const handleSuggestion = (text: string) => {
    if (isBusy) return
    void sendMessage({ text }, requestOptions)
    setInput('')
    setReferences([])
  }

  // Put the cursor in the input whenever the panel opens (or toggles between
  // docked and fullscreen, which swaps the input instance).
  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => {
      document.getElementById('ai-chat-input')?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [open, expanded])

  useEffect(() => {
    const onWindowResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', onWindowResize)
    return () => window.removeEventListener('resize', onWindowResize)
  }, [])

  // Starting a docked-sidebar drag also leaves fullscreen (the rail handles
  // its own resize inside fullscreen).
  const startSidebarResize = (e: React.MouseEvent) => {
    if (isExpanded) setIsExpanded(false)
    sidebarResize.startResize(e)
  }

  // In fullscreen mode, keep the conversation at a readable width
  const centeredClass = expanded ? 'mx-auto w-full max-w-3xl' : ''
  const hasMessages = messages.length > 0
  const collapseToolbar = !isMobile && effectiveWidth < TOOLBAR_COLLAPSE_WIDTH

  const expandToggle = !isMobile && (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          id="ai-sidebar-expand-toggle"
          variant="ghost"
          size="icon"
          aria-label={
            expanded ? 'Collapse AI sidebar' : 'Expand AI sidebar to full width'
          }
          aria-pressed={expanded}
          onClick={() => setIsExpanded((v) => !v)}
        >
          {expanded ? (
            <PanelRightClose className="h-5 w-5" />
          ) : (
            <PanelRightOpen className="h-5 w-5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {expanded ? 'Collapse panel' : 'Expand panel'}
      </TooltipContent>
    </Tooltip>
  )

  const closeButton = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          id="ai-sidebar-close"
          variant="ghost"
          size="icon"
          aria-label="Close AI Assistant"
          onClick={() => handleOpenChange(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Close</TooltipContent>
    </Tooltip>
  )

  const historyListEl = (
    <ChatHistoryList
      conversations={history.conversations}
      activeId={history.activeId}
      onSelect={handleSelectChat}
      onDelete={handleDeleteChat}
    />
  )

  // Compact toolbar shown in the header for the docked sidebar and the mobile
  // sheet. In fullscreen the same actions live in the left rail instead. When
  // the docked sidebar gets narrow, the actions collapse into an overflow menu.
  const compactToolbar = collapseToolbar ? (
    <DropdownMenu open={overflowOpen} onOpenChange={setOverflowOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              id="ai-chat-overflow-toggle"
              variant="ghost"
              size="icon"
              aria-label="Chat actions"
              aria-pressed={overflowOpen}
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Chat actions</TooltipContent>
      </Tooltip>
      <DropdownMenuContent id="ai-chat-overflow-menu" align="end" className="w-72">
        <DropdownMenuItem id="ai-chat-overflow-new" onSelect={handleNewChat}>
          <Plus className="h-4 w-4" />
          New chat
        </DropdownMenuItem>
        <DropdownMenuItem
          id="ai-chat-overflow-clear"
          disabled={!hasMessages}
          onSelect={() => setConfirmClear(true)}
        >
          <Trash2 className="h-4 w-4" />
          Clear chat
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center justify-between gap-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span>History</span>
          {history.conversations.length > 0 && (
            <button
              id="ai-chat-overflow-clear-all"
              type="button"
              onClick={() => {
                setOverflowOpen(false)
                setConfirmClearAll(true)
              }}
              className="text-xs font-normal normal-case text-muted-foreground transition-colors hover:text-destructive"
            >
              Clear all
            </button>
          )}
        </DropdownMenuLabel>
        {/* The history rows are interactive content, not menu items, so stop the
            menu's key handling from hijacking clicks inside the scroll area. */}
        <ScrollArea
          viewportProps={{ className: 'max-h-72 overscroll-contain' }}
        >
          <div onClick={(e) => e.stopPropagation()}>{historyListEl}</div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            id="ai-chat-new"
            variant="ghost"
            size="icon"
            aria-label="New chat"
            onClick={handleNewChat}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>New chat</TooltipContent>
      </Tooltip>
      <Popover open={historyOpen} onOpenChange={setHistoryOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                id="ai-chat-history-toggle"
                variant="ghost"
                size="icon"
                aria-label="Chat history"
                aria-pressed={historyOpen}
              >
                <History className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>History</TooltipContent>
        </Tooltip>
        <PopoverContent
          id="ai-chat-history-menu"
          align="end"
          className="w-80 p-2"
        >
          <div className="flex items-center justify-between gap-2 px-2 pb-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              History
            </span>
            {history.conversations.length > 0 && (
              <button
                id="ai-chat-history-clear-all"
                type="button"
                onClick={() => {
                  setHistoryOpen(false)
                  setConfirmClearAll(true)
                }}
                className="text-xs text-muted-foreground transition-colors hover:text-destructive"
              >
                Clear all
              </button>
            )}
          </div>
          <ScrollArea
            viewportProps={{ className: 'max-h-80 overscroll-contain' }}
          >
            {historyListEl}
          </ScrollArea>
        </PopoverContent>
      </Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            id="ai-chat-clear"
            variant="ghost"
            size="icon"
            aria-label="Clear chat"
            disabled={!hasMessages}
            onClick={() => setConfirmClear(true)}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Clear chat</TooltipContent>
      </Tooltip>
    </>
  )

  // Fullscreen-desktop left rail: tools at the top, a rule, then history below.
  // Its right edge is a drag handle that resizes the rail against the chat.
  const leftRail = (
    <div
      id="ai-chat-rail"
      className="relative flex shrink-0 flex-col border-r bg-sidebar"
      style={{ width: effectiveRailWidth }}
    >
      <div className="flex flex-col gap-1 p-3">
        <Button
          id="ai-chat-rail-new"
          variant="outline"
          className="justify-start gap-2"
          onClick={handleNewChat}
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
        <Button
          id="ai-chat-rail-clear"
          variant="ghost"
          className="justify-start gap-2 text-muted-foreground"
          disabled={!hasMessages}
          onClick={() => setConfirmClear(true)}
        >
          <Trash2 className="h-4 w-4" />
          Clear chat
        </Button>
      </div>
      <Separator />
      <div className="flex items-center justify-between px-4 pb-1 pt-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          History
        </span>
        {history.conversations.length > 0 && (
          <button
            id="ai-chat-rail-clear-all"
            type="button"
            onClick={() => setConfirmClearAll(true)}
            className="text-xs text-muted-foreground transition-colors hover:text-destructive"
          >
            Clear all
          </button>
        )}
      </div>
      <ScrollArea
        className="min-h-0 flex-1 px-2 pb-2"
        viewportProps={{ className: 'overscroll-contain' }}
      >
        {historyListEl}
      </ScrollArea>
      <ResizeHandle
        id="ai-chat-rail-resize"
        label="Resize history panel"
        isResizing={railResize.isResizing}
        onMouseDown={railResize.startResize}
        className="absolute inset-y-0 -right-0.5"
      />
    </div>
  )

  const clearDialog = (
    <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
      <DialogContent id="ai-chat-clear-dialog" className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Clear this chat?</DialogTitle>
          <DialogDescription>
            This removes the current conversation and its messages. Other
            conversations in your history are kept.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button id="ai-chat-clear-cancel" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            id="ai-chat-clear-confirm"
            variant="destructive"
            onClick={handleClearChat}
          >
            Clear chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const clearAllDialog = (
    <Dialog open={confirmClearAll} onOpenChange={setConfirmClearAll}>
      <DialogContent id="ai-chat-clear-all-dialog" className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Clear all history?</DialogTitle>
          <DialogDescription>
            This permanently removes every conversation from your history and
            starts a new chat. This can't be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button id="ai-chat-clear-all-cancel" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            id="ai-chat-clear-all-confirm"
            variant="destructive"
            onClick={handleClearAllHistory}
          >
            Clear all history
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const messagesArea = (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <ScrollArea
        className="min-h-0 flex-1"
        viewportRef={messagesScrollRef}
        viewportProps={{
          id: 'ai-chat-messages',
          onScroll: recomputeFades,
          // overscroll-contain stops scroll from chaining to the page when the
          // list hits its top/bottom. [&>div] makes Radix's content wrapper a
          // full-height flex column so the empty state can center vertically
          // (it defaults to display:table).
          className:
            'overscroll-contain [&>div]:!flex [&>div]:min-h-full [&>div]:flex-col',
        }}
      >
        <div className="flex flex-1 flex-col p-4">
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
            <div
              id="ai-chat-suggestions"
              className="mt-2 flex flex-wrap justify-center gap-1.5"
            >
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleSuggestion(prompt)}
                  className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
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
        </div>
      </ScrollArea>
      {/* Edge fades — hidden at the true top/bottom so the first/last message
          is never dimmed. */}
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

  // entityMeta covers project/run/sample/user; job has no entry, so fall back.
  const renderContextChip = (entity: ContextEntity, onRemove: () => void) => {
    const Icon = entity.type === 'job' ? Briefcase : entityMeta[entity.type].icon
    const color =
      entity.type === 'job'
        ? 'text-muted-foreground'
        : entityMeta[entity.type].colorClass
    return (
      <span
        key={`${entity.type}-${entity.id}`}
        className="inline-flex min-w-0 items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-xs"
      >
        <Icon className={cn('size-3.5 shrink-0', color)} />
        <span className="shrink-0 font-medium">{entity.label}</span>
        <span className="min-w-0 truncate text-muted-foreground">{entity.id}</span>
        <button
          type="button"
          aria-label={`Remove ${entity.label} ${entity.id}`}
          onClick={onRemove}
          className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="size-3" />
        </button>
      </span>
    )
  }

  const composer = (
      <SidebarFooter className="px-3 py-3">
        {/* @container so the section below adapts to the composer's own width,
            from a tiny docked sidebar up to the centered fullscreen column. */}
        <div className={cn('@container flex flex-col gap-2', centeredClass)}>
          <p
            id="ai-chat-hint"
            className="hidden @[20rem]:block px-1 text-xs text-muted-foreground"
          >
            Type <span className="font-medium text-foreground">@</span> to
            mention people or{' '}
            <span className="font-medium text-foreground">#</span> to reference
            projects, runs, or samples.
          </p>
          {hasContext && (
            <div
              id="ai-chat-context"
              className="flex min-w-0 flex-wrap items-center gap-1.5 px-1"
            >
              <span className="shrink-0 text-xs text-muted-foreground">Context</span>
              {activeContext &&
                renderContextChip(activeContext, () =>
                  setDismissedContextId(activeContext.id),
                )}
              {references.map((ref) =>
                renderContextChip(ref, () => removeReference(ref)),
              )}
            </div>
          )}
          <form
            id="ai-chat-form"
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
          >
            <TriggerTextarea
              id="ai-chat-input"
              placeholder="Ask anything…"
              rows={2}
              value={input}
              onChange={setInput}
              onReference={handleReference}
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
        </div>
      </SidebarFooter>
  )

  // Docked sidebar (desktop) and mobile sheet: the header carries the compact
  // toolbar; messages and composer sit below.
  const dockedPanel = (
    <>
      <SidebarHeader className="flex-row items-center gap-1 h-14 py-0">
        {expandToggle}
        <span className="text-lg font-semibold">AI Assistant</span>
        <div className="ml-auto flex items-center gap-0.5">
          {compactToolbar}
          {closeButton}
        </div>
      </SidebarHeader>
      {messagesArea}
      {composer}
      {clearDialog}
      {clearAllDialog}
    </>
  )

  // Fullscreen (desktop only): tools/history rail on the left, conversation
  // on the right.
  const fullscreenPanel = (
    <div className="flex min-h-0 w-full flex-1">
      {leftRail}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <SidebarHeader className="flex-row items-center gap-1 h-14 py-0">
          {expandToggle}
          <span className="text-lg font-semibold">AI Assistant</span>
          <div className="ml-auto">{closeButton}</div>
        </SidebarHeader>
        {messagesArea}
        {composer}
      </div>
      {clearDialog}
      {clearAllDialog}
    </div>
  )

  return (
    <SidebarProvider
      open={open}
      onOpenChange={handleOpenChange}
      openMobile={open}
      onOpenMobileChange={handleOpenChange}
      style={
        {
          '--sidebar-width': `${effectiveWidth}px`,
          // How much of the viewport's right side the docked sidebar
          // occupies. Fullscreen overlays (spinner, dropzone) inset
          // themselves by this so they cover only the content area.
          '--content-inset-right':
            open && !isMobile ? `${effectiveWidth}px` : '0px',
        } as React.CSSProperties
      }
    >
      {/* Container for @-variant queries so page layouts respond to the
          content width (squeezed by the sidebar), not the viewport. */}
      <div className="@container flex min-h-svh min-w-0 flex-1 flex-col">
        {children}
      </div>
      <Sidebar
        id="ai-sidebar"
        side="right"
        collapsible="offcanvas"
        className="bg-background border-l shadow-none"
        style={
          {
            '--sidebar-width': isMobile ? MOBILE_WIDTH : `${effectiveWidth}px`,
            // Inline style because tailwind-merge doesn't recognize the
            // sheet's animate-in plugin class, so an animate-none utility
            // can't reliably override it.
            ...(animateSheet ? null : { animation: 'none' }),
          } as React.CSSProperties
        }
        mobileOverlayClassName="bg-transparent"
      >
        {!expanded && (
          <>
            <ResizeHandle
              id="ai-sidebar-resize-handle"
              label="Resize AI sidebar"
              isResizing={sidebarResize.isResizing}
              onMouseDown={startSidebarResize}
              className="absolute inset-y-0 left-0 hidden md:block"
            />
            {dockedPanel}
          </>
        )}
      </Sidebar>
      {expanded &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            id="ai-sidebar-fullscreen"
            className="bg-background text-foreground fixed inset-0 z-50 flex flex-col"
          >
            {fullscreenPanel}
          </div>,
          document.body,
        )}
    </SidebarProvider>
  )
}

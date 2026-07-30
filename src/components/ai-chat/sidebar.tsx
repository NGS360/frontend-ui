import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ChatHistoryListProps } from '@/components/ai-chat/history-list'
import { AiChatComposer } from '@/components/ai-chat/composer'
import { AiChatConfirmDialog } from '@/components/ai-chat/confirm-dialog'
import { AiChatMessages } from '@/components/ai-chat/messages'
import { AiChatPane } from '@/components/ai-chat/pane'
import { AiChatRail } from '@/components/ai-chat/rail'
import { AiChatToolbar } from '@/components/ai-chat/toolbar'
import { ResizeHandle } from '@/components/resize-handle'
import { Sidebar, SidebarProvider } from '@/components/ui/sidebar'
import { useChatComposerContext } from '@/hooks/use-chat-composer-context'
import { useChatConversation } from '@/hooks/use-chat-conversation'
import { MOBILE_WIDTH, useChatPanelLayout } from '@/hooks/use-chat-panel-layout'

/**
 * Hosts the AI chat alongside the page. Owns the state both presentations share
 * — docked sidebar and fullscreen portal — because switching between them
 * remounts the pane, losing anything held further down.
 */
export function AiChatSidebarProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const conversation = useChatConversation()
  const context = useChatComposerContext()
  const [input, setInput] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmClearAll, setConfirmClearAll] = useState(false)

  const layout = useChatPanelLayout({
    // Reopen with the conversation this tab was last on.
    initialOpen: Boolean(conversation.threadId),
  })
  const { expanded, isMobile } = layout

  const handleNewChat = () => {
    conversation.showThread(undefined)
    setInput('')
    context.reset()
  }

  const handleDeleteChat = (id: string) => {
    conversation.deleteThread(id)
    if (id === conversation.threadId) {
      conversation.showThread(undefined)
      context.reset()
    }
  }

  const handleClearChat = () => {
    // A chat that never got a reply doesn't exist server-side yet.
    if (conversation.threadId) conversation.deleteThread(conversation.threadId)
    handleNewChat()
    setConfirmClear(false)
  }

  const handleClearAllHistory = () => {
    conversation.deleteAllThreads()
    handleNewChat()
    setConfirmClearAll(false)
  }

  const send = (text: string) => {
    if (!text || conversation.isBusy) return
    void conversation.sendMessage(
      { text },
      {
        // The thread travels in the body, not as the SDK's chat id; absent
        // means the server starts a new one.
        body: { thread_id: conversation.threadId, ...context.contextBody },
      },
    )
    setInput('')
    context.reset()
  }

  // Focus the input when the panel opens, and when expanding swaps it for a
  // new instance.
  useEffect(() => {
    if (!layout.open) return
    const frame = requestAnimationFrame(() => {
      document.getElementById('ai-chat-input')?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [layout.open, expanded])

  const history: ChatHistoryListProps = {
    threads: conversation.threads,
    activeId: conversation.threadId ?? '',
    isLoading: conversation.isLoadingThreads,
    isError: conversation.isErrorThreads,
    onSelect: (id) => conversation.showThread(id),
    onDelete: handleDeleteChat,
  }

  const conversationView = (
    <>
      <AiChatMessages
        messages={conversation.messages}
        status={conversation.status}
        error={conversation.error}
        isLoadingTranscript={conversation.isLoadingTranscript}
        onRetry={() => void conversation.regenerate()}
        onSuggestion={send}
        centered={expanded}
      />
      <AiChatComposer
        input={input}
        onInputChange={setInput}
        onSend={() => send(input.trim())}
        isBusy={conversation.isBusy}
        onStop={() => void conversation.stop()}
        context={context}
        className={expanded ? 'mx-auto w-full max-w-3xl' : ''}
      />
    </>
  )

  const paneProps = {
    title: conversation.activeTitle,
    // The full-panel gradient belongs to the empty state; keeping it off while
    // a transcript loads avoids a flash behind the spinner.
    gradientVariant:
      conversation.hasMessages || conversation.isLoadingTranscript
        ? ('top' as const)
        : ('full' as const),
    expanded,
    onToggleExpand: isMobile ? undefined : layout.toggleExpanded,
    onClose: () => layout.setOpen(false),
    onDropFiles: context.addFiles,
  }

  const dialogs = (
    <>
      <AiChatConfirmDialog
        idPrefix="ai-chat-clear"
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Clear this chat?"
        description="This removes the current conversation and its messages. Other conversations in your history are kept."
        confirmLabel="Clear chat"
        onConfirm={handleClearChat}
      />
      <AiChatConfirmDialog
        idPrefix="ai-chat-clear-all"
        open={confirmClearAll}
        onOpenChange={setConfirmClearAll}
        title="Clear all history?"
        description="This permanently removes every conversation from your history and starts a new chat. This can't be undone."
        confirmLabel="Clear all history"
        onConfirm={handleClearAllHistory}
      />
    </>
  )

  return (
    <SidebarProvider
      open={layout.open}
      onOpenChange={layout.setOpen}
      openMobile={layout.open}
      onOpenMobileChange={layout.setOpen}
      style={
        {
          '--sidebar-width': `${layout.width}px`,
          // How much of the right edge the docked sidebar takes; overlays
          // inset by this to cover only the content area.
          '--content-inset-right':
            layout.open && !isMobile ? `${layout.width}px` : '0px',
        } as React.CSSProperties
      }
    >
      {/* Container for @-variant queries, so page layouts respond to the
          content width rather than the viewport. */}
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
            '--sidebar-width': isMobile ? MOBILE_WIDTH : `${layout.width}px`,
            // Inline because tailwind-merge can't override the sheet's
            // animate-in plugin class.
            ...(layout.animateSheet ? null : { animation: 'none' }),
          } as React.CSSProperties
        }
        mobileOverlayClassName="bg-transparent"
      >
        {!expanded && (
          <>
            <ResizeHandle
              id="ai-sidebar-resize-handle"
              label="Resize AI sidebar"
              isResizing={layout.sidebarResize.isResizing}
              onMouseDown={layout.sidebarResize.startResize}
              className="absolute inset-y-0 left-0 hidden md:block"
            />
            <AiChatPane
              {...paneProps}
              toolbar={
                <AiChatToolbar
                  collapsed={layout.collapseToolbar}
                  hasMessages={conversation.hasMessages}
                  history={history}
                  onNewChat={handleNewChat}
                  onClearChat={() => setConfirmClear(true)}
                  onClearAll={() => setConfirmClearAll(true)}
                />
              }
            >
              {conversationView}
            </AiChatPane>
            {dialogs}
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
            {/* Tools and history live in the rail; the pane beside it holds
                the conversation. */}
            <div className="flex min-h-0 w-full flex-1">
              <AiChatRail
                width={layout.railWidth}
                resize={layout.railResize}
                hasMessages={conversation.hasMessages}
                history={history}
                onNewChat={handleNewChat}
                onClearChat={() => setConfirmClear(true)}
                onClearAll={() => setConfirmClearAll(true)}
              />
              <AiChatPane {...paneProps} className="min-w-0">
                {conversationView}
              </AiChatPane>
              {dialogs}
            </div>
          </div>,
          document.body,
        )}
    </SidebarProvider>
  )
}

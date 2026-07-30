import { Plus, Trash2 } from 'lucide-react'
import type { ChatHistoryListProps } from '@/components/ai-chat/history-list'
import { ChatHistoryList } from '@/components/ai-chat/history-list'
import { ResizeHandle } from '@/components/resize-handle'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

/**
 * Fullscreen-desktop left rail: tools at the top, a rule, then history below.
 * Its right edge is a drag handle that resizes the rail against the chat.
 */
export function AiChatRail({
  width,
  resize,
  hasMessages,
  history,
  onNewChat,
  onClearChat,
  onClearAll,
}: {
  width: number
  resize: { isResizing: boolean; startResize: (e: React.MouseEvent) => void }
  hasMessages: boolean
  history: ChatHistoryListProps
  onNewChat: () => void
  onClearChat: () => void
  onClearAll: () => void
}) {
  return (
    <div
      id="ai-chat-rail"
      className="relative flex shrink-0 flex-col border-r bg-sidebar"
      style={{ width }}
    >
      <div className="flex flex-col gap-1 p-3">
        <Button
          id="ai-chat-rail-new"
          variant="outline"
          className="justify-start gap-2"
          onClick={onNewChat}
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
        <Button
          id="ai-chat-rail-clear"
          variant="ghost"
          className="justify-start gap-2 text-muted-foreground"
          disabled={!hasMessages}
          onClick={onClearChat}
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
        {history.threads.length > 0 && (
          <button
            id="ai-chat-rail-clear-all"
            type="button"
            onClick={onClearAll}
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
        <ChatHistoryList {...history} />
      </ScrollArea>
      <ResizeHandle
        id="ai-chat-rail-resize"
        label="Resize history panel"
        isResizing={resize.isResizing}
        onMouseDown={resize.startResize}
        className="absolute inset-y-0 -right-0.5"
      />
    </div>
  )
}

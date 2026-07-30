import { History, MoreHorizontal, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { ChatHistoryListProps } from '@/components/ai-chat/history-list'
import { ChatHistoryList } from '@/components/ai-chat/history-list'
import { Button } from '@/components/ui/button'
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

/**
 * New chat, history, and clear, for the header of the docked sidebar and the
 * mobile sheet. A narrow panel (`collapsed`) folds them into an overflow menu.
 */
export function AiChatToolbar({
  collapsed,
  hasMessages,
  history,
  onNewChat,
  onClearChat,
  onClearAll,
}: {
  collapsed: boolean
  hasMessages: boolean
  history: ChatHistoryListProps
  onNewChat: () => void
  onClearChat: () => void
  onClearAll: () => void
}) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [overflowOpen, setOverflowOpen] = useState(false)

  const closeMenus = () => {
    setHistoryOpen(false)
    setOverflowOpen(false)
  }
  const withMenusClosed = (action: () => void) => () => {
    closeMenus()
    action()
  }

  // Picking a conversation dismisses whichever menu it was picked from.
  const historyList = (
    <ChatHistoryList
      {...history}
      onSelect={(id) => {
        closeMenus()
        history.onSelect(id)
      }}
    />
  )

  if (collapsed) {
    return (
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
        <DropdownMenuContent
          id="ai-chat-overflow-menu"
          align="end"
          className="w-72"
        >
          <DropdownMenuItem
            id="ai-chat-overflow-new"
            onSelect={withMenusClosed(onNewChat)}
          >
            <Plus className="h-4 w-4" />
            New chat
          </DropdownMenuItem>
          <DropdownMenuItem
            id="ai-chat-overflow-clear"
            disabled={!hasMessages}
            onSelect={onClearChat}
          >
            <Trash2 className="h-4 w-4" />
            Clear chat
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="flex items-center justify-between gap-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span>History</span>
            {history.threads.length > 0 && (
              <button
                id="ai-chat-overflow-clear-all"
                type="button"
                onClick={withMenusClosed(onClearAll)}
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
            <div onClick={(e) => e.stopPropagation()}>{historyList}</div>
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            id="ai-chat-new"
            variant="ghost"
            size="icon"
            aria-label="New chat"
            onClick={withMenusClosed(onNewChat)}
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
            {history.threads.length > 0 && (
              <button
                id="ai-chat-history-clear-all"
                type="button"
                onClick={withMenusClosed(onClearAll)}
                className="text-xs text-muted-foreground transition-colors hover:text-destructive"
              >
                Clear all
              </button>
            )}
          </div>
          <ScrollArea
            viewportProps={{ className: 'max-h-80 overscroll-contain' }}
          >
            {historyList}
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
            onClick={onClearChat}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Clear chat</TooltipContent>
      </Tooltip>
    </>
  )
}

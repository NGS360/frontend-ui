import { MessageSquare, Trash2 } from 'lucide-react'
import type { ChatConversation } from '@/hooks/use-chat-history'
import { Button } from '@/components/ui/button'
import { cn, relativeTime } from '@/lib/utils'

export function ChatHistoryList({
  conversations,
  activeId,
  onSelect,
  onDelete,
  className,
}: {
  conversations: Array<ChatConversation>
  activeId: string
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  className?: string
}) {
  if (conversations.length === 0) {
    return (
      <p className="px-2 py-6 text-center text-sm text-muted-foreground">
        No conversations yet.
      </p>
    )
  }

  return (
    <ul className={cn('flex flex-col gap-0.5', className)}>
      {conversations.map((conversation) => (
        <li key={conversation.id} className="group/item relative">
          <button
            type="button"
            id={`ai-chat-history-${conversation.id}`}
            data-active={conversation.id === activeId}
            onClick={() => onSelect(conversation.id)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md py-2 pl-2 pr-8 text-left text-sm',
              'hover:bg-accent hover:text-accent-foreground',
              'data-[active=true]:bg-accent data-[active=true]:text-accent-foreground',
            )}
          >
            <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{conversation.title}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {relativeTime(conversation.updatedAt)}
            </span>
          </button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Delete conversation: ${conversation.title}`}
            onClick={(e) => {
              e.stopPropagation()
              onDelete(conversation.id)
            }}
            className="absolute right-1 top-1/2 size-6 -translate-y-1/2 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover/item:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </li>
      ))}
    </ul>
  )
}

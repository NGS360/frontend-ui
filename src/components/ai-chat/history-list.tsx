import { MessageSquare, Trash2 } from 'lucide-react'
import type { ChatThreadPublic } from '@/client'
import { Button } from '@/components/ui/button'
import { cn, relativeTime } from '@/lib/utils'

/** Shared by the places that host the list: the header menus and the rail. */
export interface ChatHistoryListProps {
  threads: Array<ChatThreadPublic>
  activeId: string
  /** History is fetched now, so the list has states it didn't used to. */
  isLoading?: boolean
  isError?: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  className?: string
}

export function ChatHistoryList({
  threads,
  activeId,
  isLoading = false,
  isError = false,
  onSelect,
  onDelete,
  className,
}: ChatHistoryListProps) {
  if (isLoading) {
    return (
      <ul className={cn('flex flex-col gap-0.5', className)} aria-busy>
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex items-center gap-2 px-2 py-2">
            <span className="size-4 shrink-0 animate-pulse rounded bg-muted" />
            <span className="h-4 flex-1 animate-pulse rounded bg-muted" />
          </li>
        ))}
      </ul>
    )
  }

  if (isError) {
    return (
      <p className="px-2 py-6 text-center text-sm text-destructive">
        Couldn't load your conversations.
      </p>
    )
  }

  if (threads.length === 0) {
    return (
      <p className="px-2 py-6 text-center text-sm text-muted-foreground">
        No conversations yet.
      </p>
    )
  }

  return (
    <ul className={cn('flex flex-col gap-0.5', className)}>
      {threads.map((thread) => (
        <li key={thread.id} className="group/item relative">
          <button
            type="button"
            id={`ai-chat-history-${thread.id}`}
            data-active={thread.id === activeId}
            onClick={() => onSelect(thread.id)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md py-2 pl-2 pr-8 text-left text-sm',
              'hover:bg-accent hover:text-accent-foreground',
              'data-[active=true]:bg-accent data-[active=true]:text-accent-foreground',
            )}
          >
            <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{thread.title}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {/* The API sends ISO timestamps; relativeTime works in epoch ms. */}
              {thread.updated_at
                ? relativeTime(Date.parse(thread.updated_at))
                : ''}
            </span>
          </button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Delete conversation: ${thread.title}`}
            onClick={(e) => {
              e.stopPropagation()
              onDelete(thread.id)
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

import { Briefcase, Paperclip, X } from 'lucide-react'
import type { Attachment, ContextEntity } from '@/lib/chat-context'
import { entityMeta } from '@/lib/entity-icons'
import { cn, formatBytes } from '@/lib/utils'

/** Chips in the composer showing what's staged as context for the next message. */

const CHIP =
  'inline-flex min-w-0 items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-xs'
const REMOVE =
  'shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground'

export function ContextChip({
  entity,
  onRemove,
}: {
  entity: ContextEntity
  onRemove: () => void
}) {
  // entityMeta covers project/run/sample/user; job has no entry, so fall back.
  const Icon = entity.type === 'job' ? Briefcase : entityMeta[entity.type].icon
  const color =
    entity.type === 'job'
      ? 'text-muted-foreground'
      : entityMeta[entity.type].colorClass

  return (
    <span className={CHIP}>
      <Icon className={cn('size-3.5 shrink-0', color)} />
      <span className="shrink-0 font-medium">{entity.label}</span>
      <span className="min-w-0 truncate text-muted-foreground">
        {entity.id}
      </span>
      <button
        type="button"
        aria-label={`Remove ${entity.label} ${entity.id}`}
        onClick={onRemove}
        className={REMOVE}
      >
        <X className="size-3" />
      </button>
    </span>
  )
}

export function AttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: Attachment
  onRemove: () => void
}) {
  return (
    <span className={CHIP}>
      <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 truncate font-medium">
        {attachment.file.name}
      </span>
      <span className="shrink-0 text-muted-foreground">
        {formatBytes(attachment.file.size)}
      </span>
      <button
        type="button"
        aria-label={`Remove ${attachment.file.name}`}
        onClick={onRemove}
        className={REMOVE}
      >
        <X className="size-3" />
      </button>
    </span>
  )
}

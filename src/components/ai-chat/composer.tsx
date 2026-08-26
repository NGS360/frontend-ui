import { Paperclip, Send, Square } from 'lucide-react'
import { useRef } from 'react'
import type { ChatComposerContext } from '@/hooks/use-chat-composer-context'
import { AttachmentChip, ContextChip } from '@/components/ai-chat/context-chips'
import { TriggerTextarea } from '@/components/trigger-input'
import { Button } from '@/components/ui/button'
import { SidebarFooter } from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ACCEPTED_ATTACHMENTS_LABEL,
  ATTACHMENT_ACCEPT,
} from '@/lib/chat-attachments'
import { cn } from '@/lib/utils'

/** The input, its context chip row, and the send/stop control. */
export function AiChatComposer({
  input,
  onInputChange,
  onSend,
  isBusy,
  onStop,
  context,
  className,
}: {
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  isBusy: boolean
  onStop: () => void
  context: ChatComposerContext
  className?: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <SidebarFooter className="px-3 py-3">
      {/* @container so the section below adapts to the composer's own width,
          from a tiny docked sidebar up to the centered fullscreen column. */}
      <div className={cn('@container flex flex-col gap-2', className)}>
        <p
          id="ai-chat-hint"
          className="hidden @[20rem]:block px-1 text-xs text-muted-foreground"
        >
          Type <span className="font-medium text-foreground">@</span> to mention
          people or <span className="font-medium text-foreground">#</span> to
          reference projects, runs, or samples.
        </p>
        {context.hasContext && (
          <div
            id="ai-chat-context"
            className="flex min-w-0 flex-wrap items-center gap-1.5 px-1"
          >
            <span className="shrink-0 text-xs text-muted-foreground">
              Context
            </span>
            {context.activeContext && (
              <ContextChip
                entity={context.activeContext}
                onRemove={context.dismissActiveContext}
              />
            )}
            {context.references.map((reference) => (
              <ContextChip
                key={`${reference.type}-${reference.id}`}
                entity={reference}
                onRemove={() => context.removeReference(reference)}
              />
            ))}
            {context.attachments.map((attachment) => (
              <AttachmentChip
                key={attachment.id}
                attachment={attachment}
                onRemove={() => context.removeAttachment(attachment.id)}
              />
            ))}
          </div>
        )}
        <form
          id="ai-chat-form"
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            onSend()
          }}
        >
          {/* Paperclip floats inside the input on the left (like the search
              bar's icon); pl-9 keeps the text clear of it. */}
          <div className="relative flex-1">
            {/* Says up front that a file will not get through, rather than
                letting the user pick one and find out from a toast. The formats
                stay listed: the affordance is being kept, not withdrawn. */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  id="ai-chat-attach"
                  type="button"
                  aria-label={`Attach files (${ACCEPTED_ATTACHMENTS_LABEL}) — not read by the assistant yet`}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 left-2 z-10 rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Paperclip className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                Attach a text file ({ACCEPTED_ATTACHMENTS_LABEL}) — not read by
                the assistant yet
              </TooltipContent>
            </Tooltip>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ATTACHMENT_ACCEPT}
              className="hidden"
              onChange={(e) => {
                context.addFiles(Array.from(e.target.files ?? []))
                // Reset so picking the same file again still fires onChange.
                e.target.value = ''
              }}
            />
            <TriggerTextarea
              id="ai-chat-input"
              placeholder="Ask anything…"
              rows={2}
              value={input}
              onChange={onInputChange}
              onReference={context.addReference}
              className="max-h-40 min-h-0 w-full resize-none pl-9"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  e.currentTarget.form?.requestSubmit()
                }
              }}
            />
          </div>
          {isBusy ? (
            <Button
              id="ai-chat-stop"
              type="button"
              size="icon"
              variant="outline"
              aria-label="Stop generating"
              onClick={onStop}
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
}

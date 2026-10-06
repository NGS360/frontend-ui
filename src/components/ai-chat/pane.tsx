import { PanelRightClose, PanelRightOpen, X } from 'lucide-react'
import { ContainerDropzone } from '@/components/file-upload'
import { Button } from '@/components/ui/button'
import { SidebarHeader } from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/**
 * Chrome shared by both presentations: gradient, header, and the drop target
 * around the transcript and composer. Only the docked sidebar passes a
 * `toolbar` — fullscreen puts those actions in the rail beside this pane.
 */
export function AiChatPane({
  title,
  gradientVariant,
  expanded,
  onToggleExpand,
  onClose,
  toolbar,
  onDropFiles,
  className,
  children,
}: {
  title: string | undefined
  gradientVariant: 'top' | 'full'
  expanded: boolean
  /** Omitted on mobile, where fullscreen doesn't apply. */
  onToggleExpand?: () => void
  onClose: () => void
  toolbar?: React.ReactNode
  onDropFiles: (files: Array<File>) => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn('relative isolate flex min-h-0 flex-1 flex-col', className)}
    >
      <div
        aria-hidden
        className="ai-chat-gradient"
        data-variant={gradientVariant}
      />
      <div
        aria-hidden
        className="ai-chat-corner-glow"
        data-variant={gradientVariant}
      />
      <SidebarHeader className="flex-row items-center gap-1 h-14 min-w-0 py-0">
        {onToggleExpand && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                id="ai-sidebar-expand-toggle"
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label={
                  expanded
                    ? 'Collapse AI sidebar'
                    : 'Expand AI sidebar to full width'
                }
                aria-pressed={expanded}
                onClick={onToggleExpand}
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
        )}
        <span
          id="ai-chat-title"
          // Truncation hides the rest, so keep it reachable on hover.
          title={title}
          className="min-w-0 truncate text-lg font-semibold"
        >
          {title ?? 'AI Assistant'}
        </span>
        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          {toolbar}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                id="ai-sidebar-close"
                variant="ghost"
                size="icon"
                aria-label="Close AI Assistant"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close</TooltipContent>
          </Tooltip>
        </div>
      </SidebarHeader>
      <ContainerDropzone
        multiple
        onDrop={onDropFiles}
        subject="to the chat"
        className="flex min-h-0 flex-1 flex-col"
      >
        {children}
      </ContainerDropzone>
    </div>
  )
}

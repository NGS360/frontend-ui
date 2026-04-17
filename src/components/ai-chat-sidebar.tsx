import { PanelRightClose, PanelRightOpen, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const MIN_WIDTH = 240
const MIN_CONTENT_WIDTH = 480
const DEFAULT_WIDTH = 384

const clampWidth = (w: number) => {
  const max = Math.max(MIN_WIDTH, window.innerWidth - MIN_CONTENT_WIDTH)
  return Math.max(MIN_WIDTH, Math.min(max, w))
}

export function AiChatSidebarProvider({ children }: { children: React.ReactNode }) {
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [isResizing, setIsResizing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const resizingRef = useRef(false)

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

  const panel = (
    <>
      <SidebarHeader className="flex-row items-center gap-2 h-14 py-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              id="ai-sidebar-expand-toggle"
              variant="ghost"
              size="icon"
              aria-label={isExpanded ? 'Collapse AI sidebar' : 'Expand AI sidebar to full width'}
              aria-pressed={isExpanded}
              onClick={() => setIsExpanded((v) => !v)}
            >
              {isExpanded ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isExpanded ? 'Collapse panel' : 'Expand panel'}</TooltipContent>
        </Tooltip>
        <span className="text-lg font-semibold">AI Assistant</span>
      </SidebarHeader>
      <SidebarContent className="p-4 text-sm text-muted-foreground">
        AI features are coming soon.
      </SidebarContent>
      <SidebarFooter className="h-24 justify-center px-3 py-0">
        <form
          id="ai-chat-form"
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            /* TODO: send message */
          }}
        >
          <Textarea
            id="ai-chat-input"
            placeholder="Ask anything..."
            rows={2}
            className="min-h-0 flex-1 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                e.currentTarget.form?.requestSubmit()
              }
            }}
          />
          <Button id="ai-chat-send" type="submit" size="icon" aria-label="Send">
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </SidebarFooter>
    </>
  )

  return (
    <SidebarProvider
      defaultOpen={false}
      style={{ '--sidebar-width': `${width}px` } as React.CSSProperties}
    >
      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        {children}
      </div>
      <Sidebar id="ai-sidebar" side="right" collapsible="offcanvas" className="bg-background">
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
      {isExpanded && typeof document !== 'undefined' && createPortal(
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

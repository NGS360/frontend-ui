import { useEffect, useState } from 'react'
import { useDragResize } from '@/hooks/use-drag-resize'
import { useIsMobile } from '@/hooks/use-mobile'

/**
 * Where the AI chat panel sits and how big it is: open/closed, docked vs
 * fullscreen, and the dragged widths. Knows nothing about conversations.
 */

const MIN_WIDTH = 240
const MIN_CONTENT_WIDTH = 480
const DEFAULT_WIDTH = 384
// On mobile the panel overlays the page instead of pushing it, so it ignores
// the resizable width and its clamp.
export const MOBILE_WIDTH = '100vw'

const clampWidth = (w: number, viewport: number) => {
  const max = Math.max(MIN_WIDTH, viewport - MIN_CONTENT_WIDTH)
  return Math.max(MIN_WIDTH, Math.min(max, w))
}

// Below this docked width the toolbar actions collapse into an overflow menu.
const TOOLBAR_COLLAPSE_WIDTH = 360

// Fullscreen left rail (history panel) resize bounds.
const RAIL_MIN_WIDTH = 200
const RAIL_MAX_WIDTH = 420
const RAIL_DEFAULT_WIDTH = 256
const RAIL_MIN_CHAT_WIDTH = 360

const clampRailWidth = (w: number, viewport: number) => {
  const max = Math.min(RAIL_MAX_WIDTH, viewport - RAIL_MIN_CHAT_WIDTH)
  return Math.max(RAIL_MIN_WIDTH, Math.min(Math.max(RAIL_MIN_WIDTH, max), w))
}

export function useChatPanelLayout({ initialOpen }: { initialOpen: boolean }) {
  // One open state for both the desktop sidebar and the mobile sheet, so the
  // panel survives the viewport crossing the breakpoint.
  const [open, setOpen] = useState(initialOpen)
  // The width the user dragged to, never clamped in place — the rendered width
  // is derived, so shrinking the window doesn't lose the preference.
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [railWidth, setRailWidth] = useState(RAIL_DEFAULT_WIDTH)
  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth)
  const isMobile = useIsMobile()
  const [isExpanded, setIsExpanded] = useState(false)

  const effectiveWidth = clampWidth(width, windowWidth)
  const effectiveRailWidth = clampRailWidth(railWidth, windowWidth)
  // Fullscreen is desktop-only: the mobile sheet is already full width, and the
  // orphaned Sheet behind the portal would render as a blank layer.
  const expanded = isExpanded && !isMobile

  // The docked sidebar grows from the viewport's right edge; the fullscreen
  // rail grows from the left edge of its container.
  const sidebarResize = useDragResize((e) =>
    setWidth(clampWidth(window.innerWidth - e.clientX, window.innerWidth)),
  )
  const railResize = useDragResize((e) =>
    setRailWidth(clampRailWidth(e.clientX, window.innerWidth)),
  )

  // Slide the sheet in only when the user opens it; a chat that was already
  // open when the viewport crossed into mobile swaps presentation silently.
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

  useEffect(() => {
    const onWindowResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', onWindowResize)
    return () => window.removeEventListener('resize', onWindowResize)
  }, [])

  // Closing exits fullscreen, so the chat always reopens docked.
  const setOpenState = (next: boolean) => {
    setOpen(next)
    if (!next) setIsExpanded(false)
  }

  // Dragging the docked edge also leaves fullscreen, where the rail owns resize.
  const startSidebarResize = (e: React.MouseEvent) => {
    if (isExpanded) setIsExpanded(false)
    sidebarResize.startResize(e)
  }

  return {
    open,
    setOpen: setOpenState,
    isMobile,
    expanded,
    toggleExpanded: () => setIsExpanded((v) => !v),
    width: effectiveWidth,
    railWidth: effectiveRailWidth,
    animateSheet,
    /** Narrow docked panel: header actions fold into an overflow menu. */
    collapseToolbar: !isMobile && effectiveWidth < TOOLBAR_COLLAPSE_WIDTH,
    sidebarResize: {
      isResizing: sidebarResize.isResizing,
      startResize: startSidebarResize,
    },
    railResize,
  }
}

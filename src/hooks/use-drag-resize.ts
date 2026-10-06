import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Shared horizontal drag-to-resize logic. The caller owns the size state and
 * decides how a pointer position maps to a size (so it works for a panel
 * docked on either edge); this hook only manages the drag lifecycle —
 * tracking the active drag, the body cursor, and the window listeners.
 *
 * Used by the AI sidebar (resize its docked width) and the fullscreen chat's
 * left rail (resize the history panel).
 */
export function useDragResize(onResize: (e: MouseEvent) => void) {
  const [isResizing, setIsResizing] = useState(false)
  const activeRef = useRef(false)
  // Keep the latest callback without re-subscribing the window listeners.
  const onResizeRef = useRef(onResize)
  onResizeRef.current = onResize

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (activeRef.current) onResizeRef.current(e)
    }
    const onUp = () => {
      if (!activeRef.current) return
      activeRef.current = false
      setIsResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    activeRef.current = true
    setIsResizing(true)
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
  }, [])

  return { isResizing, startResize }
}

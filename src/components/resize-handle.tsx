import { cn } from '@/lib/utils'

/**
 * Thin vertical divider that starts a horizontal resize drag. Pair with
 * useDragResize, which owns the drag lifecycle. Position it with `className`
 * (e.g. `absolute inset-y-0 left-0`) against a `relative` parent.
 */
export function ResizeHandle({
  id,
  label = 'Resize',
  isResizing,
  onMouseDown,
  className,
}: {
  id?: string
  label?: string
  isResizing: boolean
  onMouseDown: (e: React.MouseEvent) => void
  className?: string
}) {
  return (
    <div
      id={id}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      onMouseDown={onMouseDown}
      data-resizing={isResizing}
      className={cn(
        'z-30 w-1 cursor-ew-resize transition-colors duration-0 hover:bg-primary hover:delay-500 data-[resizing=true]:bg-primary',
        className,
      )}
    />
  )
}

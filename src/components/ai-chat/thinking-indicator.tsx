import { useRef } from 'react'
import { useHeldValue } from '@/hooks/use-held-value'
import { cn } from '@/lib/utils'

/** Schema introspection returns in tens of ms; without a floor the line strobes. */
const LABEL_HOLD_MS = 400

/**
 * The transcript's working state. The label is the animation — a highlight
 * travels across the glyphs (`gradient-text-sweep` in styles.css) — so there is
 * no spinner beside it. Flat text like the error row, not a bubble.
 *
 * `detail` names the running step on a second line rather than replacing the
 * label: the sweep sizes its gradient to the element's own width, so changing
 * the animated text would make it jump mid-pass.
 */
export function AiChatThinkingIndicator({
  detail,
  className,
}: {
  /** The current step, e.g. a derived tool label. Omitted when unknown. */
  detail?: string
  className?: string
}) {
  // Once a step has been named the line never blanks again this turn: between
  // calls the agent is reasoning, and a line that disappears there reads as the
  // agent having stopped.
  const lastNamed = useRef<string | undefined>(undefined)
  if (detail !== undefined) lastNamed.current = detail
  const heldDetail = useHeldValue(detail ?? lastNamed.current, LABEL_HOLD_MS)

  return (
    <div data-slot="ai-chat-thinking" className={cn('w-fit', className)}>
      <div className="gradient-text-sweep w-fit text-sm text-muted-foreground">
        Thinking…
      </div>
      {heldDetail && (
        <div
          data-slot="ai-chat-thinking-detail"
          className="mt-0.5 text-xs text-muted-foreground/70"
        >
          {heldDetail}
        </div>
      )}
    </div>
  )
}

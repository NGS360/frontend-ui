import { Sparkles, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useAiChatTipStore } from '@/stores/ai-chat-tip-store'

/** How long the tip stays on screen before hiding on its own */
const AUTO_HIDE_MS = 10_000

/**
 * Visibility logic for the AI Assistant intro tip. It auto-hides after 10
 * seconds and returns next visit; dismissing it — or opening the sidebar —
 * hides it for good.
 *
 * A hook so the header can also suppress the AI button's tooltip meanwhile,
 * which would otherwise sit over the tip's dismiss button and eat its clicks.
 */
export function useAiChatTip(aiSidebarOpen: boolean) {
  const { data: user } = useCurrentUser()
  const username = user?.username
  const dismissedBy = useAiChatTipStore((state) => state.dismissedBy)
  const storeDismiss = useAiChatTipStore((state) => state.dismiss)
  const dismissed = !username || Boolean(dismissedBy[username])

  const [autoHidden, setAutoHidden] = useState(false)

  useEffect(() => {
    if (dismissed) return
    const id = setTimeout(() => setAutoHidden(true), AUTO_HIDE_MS)
    return () => clearTimeout(id)
  }, [dismissed])

  // Opening the sidebar means the user found the feature — no need to tip again
  useEffect(() => {
    if (aiSidebarOpen && username && !dismissedBy[username]) {
      storeDismiss(username)
    }
  }, [aiSidebarOpen, username, dismissedBy, storeDismiss])

  return {
    visible: !dismissed && !autoHidden && !aiSidebarOpen,
    dismiss: () => {
      if (username) storeDismiss(username)
    },
  }
}

/**
 * One-time callout pointing at the AI Assistant toggle in the header.
 * Render inside a `relative` wrapper around the toggle; drive it with
 * {@link useAiChatTip}.
 */
export function AiChatTip({
  visible,
  onDismiss,
}: {
  visible: boolean
  onDismiss: () => void
}) {
  if (!visible) return null

  return (
    <div
      id="ai-chat-tip"
      role="status"
      className="absolute right-0 top-full z-50 mt-3 w-72 rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg animate-in fade-in-0 slide-in-from-top-2"
    >
      {/* Arrow pointing up at the AI button */}
      <div className="absolute -top-1.5 right-3.5 size-3 rotate-45 border-l border-t bg-popover" />

      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="flex-1 text-sm">
          <p className="font-medium">Meet the AI Assistant</p>
          <p className="mt-1 text-muted-foreground">
            Click the sparkle icon above to ask questions about your runs and
            projects.
          </p>
        </div>
        <Button
          id="ai-chat-tip-dismiss"
          variant="ghost"
          size="icon"
          className="-mr-1 -mt-1 size-6 shrink-0"
          aria-label="Dismiss AI Assistant tip"
          onClick={onDismiss}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  )
}

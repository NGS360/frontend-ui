import { useEffect, useState } from 'react'
import { CheckIcon, CopyIcon, ExternalLinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * Confirm step for an off-origin link in an assistant reply, standing in for
 * Streamdown's built-in link-safety modal via `linkSafety.renderModal`.
 *
 * Two reasons it's ours rather than theirs. Theirs renders inline next to the
 * link, so its `z-50` overlay is trapped inside the sidebar's `z-10` stacking
 * context and paints *under* the `z-30` app header — the header stayed sharp
 * while the rest of the page blurred. Radix portals to `<body>`, putting the
 * overlay in the root stacking context. Theirs is also a
 * `role="button"` div with no `aria-modal` and no focus trap; Radix supplies
 * both.
 *
 * Props are Streamdown's `LinkSafetyModalProps`. `onConfirm` is their
 * `window.open(url, '_blank', 'noreferrer')`, so navigation stays their call.
 */
export function AiChatLinkDialog({
  isOpen,
  onClose,
  onConfirm,
  url,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  url: string
}) {
  const [copied, setCopied] = useState(false)

  // Reopening on a different link shouldn't inherit the last one's tick.
  useEffect(() => {
    if (!isOpen) setCopied(false)
  }, [isOpen])

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      // A denied clipboard permission shouldn't look like a broken dialog; the
      // URL is on screen and selectable either way.
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        id="ai-chat-link-dialog"
        className="sm:max-w-md"
        overlayClassName="backdrop-blur-sm"
      >
        <DialogHeader>
          <DialogTitle>Open external link?</DialogTitle>
          <DialogDescription>
            This link came from the assistant and leaves NGS360. Check where it
            goes before opening it.
          </DialogDescription>
        </DialogHeader>
        {/* wrap-anywhere, or one long query string blows out the dialog width. */}
        <p
          id="ai-chat-link-url"
          className="wrap-anywhere rounded-md border bg-muted/40 p-2 font-mono text-xs"
        >
          {url}
        </p>
        <DialogFooter>
          <Button id="ai-chat-link-copy" variant="outline" onClick={onCopy}>
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? 'Copied' : 'Copy link'}
          </Button>
          <Button
            id="ai-chat-link-open"
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            <ExternalLinkIcon />
            Open link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

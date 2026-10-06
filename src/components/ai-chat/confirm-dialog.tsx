import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * Destructive-confirm dialog for the chat's clear actions. Element ids are
 * derived from `idPrefix` (`-dialog`, `-cancel`, `-confirm`).
 */
export function AiChatConfirmDialog({
  idPrefix,
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  idPrefix: string
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id={`${idPrefix}-dialog`} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button id={`${idPrefix}-cancel`} variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            id={`${idPrefix}-confirm`}
            variant="destructive"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

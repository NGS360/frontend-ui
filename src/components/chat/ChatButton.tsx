import { useState } from 'react'
import { MessageCircleIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatPanel } from './ChatPanel'
import { cn } from '@/lib/utils'

export function ChatButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Chat panel */}
      <div
        className={cn(
          'fixed bottom-20 right-6 z-50 flex flex-col rounded-lg border bg-background shadow-lg transition-all duration-200',
          isOpen
            ? 'h-[min(600px,80vh)] w-[min(420px,calc(100vw-3rem))] opacity-100 scale-100'
            : 'h-0 w-0 opacity-0 scale-95 pointer-events-none',
        )}
      >
        {isOpen && <ChatPanel />}
      </div>

      {/* Floating action button */}
      <Button
        size="icon"
        className="fixed bottom-6 right-6 z-50 size-12 rounded-full shadow-lg"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <XIcon className="size-5" />
        ) : (
          <MessageCircleIcon className="size-5" />
        )}
      </Button>
    </>
  )
}

import { AlertTriangle, ChevronDown, RotateCcw, ServerCrash, WifiOff } from 'lucide-react'
import { cva } from 'class-variance-authority'
import { useState } from 'react'

import type { ErrorKind } from '@/lib/error-utils'
import { cn } from '@/lib/utils'
import { classifyError, getTechnicalDetail } from '@/lib/error-utils'
import { Button } from '@/components/ui/button'

const bannerVariants = cva('rounded-lg border p-3', {
  variants: {
    kind: {
      server: 'border-destructive/30 bg-destructive/5',
      network: 'border-amber-500/30 bg-amber-500/5',
      client: 'border-border bg-muted/30',
      unknown: 'border-border bg-muted/30',
    },
  },
  defaultVariants: {
    kind: 'unknown',
  },
})

const iconVariants = cva('h-5 w-5 flex-shrink-0 mt-0.5', {
  variants: {
    kind: {
      server: 'text-destructive',
      network: 'text-amber-600 dark:text-amber-400',
      client: 'text-muted-foreground',
      unknown: 'text-muted-foreground',
    },
  },
  defaultVariants: {
    kind: 'unknown',
  },
})

function iconFor(kind: ErrorKind) {
  switch (kind) {
    case 'server':
      return ServerCrash
    case 'network':
      return WifiOff
    case 'client':
    case 'unknown':
    default:
      return AlertTriangle
  }
}

export interface ErrorBannerProps {
  error: unknown
  onRetry?: () => void
  className?: string
}

export function ErrorBanner({ error, onRetry, className }: ErrorBannerProps) {
  const info = classifyError(error)
  const Icon = iconFor(info.kind)
  const technicalDetail = getTechnicalDetail(error, info)
  const [detailsOpen, setDetailsOpen] = useState(false)

  return (
    <div role="alert" className={cn(bannerVariants({ kind: info.kind }), className)}>
      <div className="flex items-start gap-3">
        <Icon className={iconVariants({ kind: info.kind })} strokeWidth={2} />
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-sm font-medium text-foreground">{info.title}</p>
          <p className="text-sm text-muted-foreground">{info.description}</p>
        </div>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry} className="flex-shrink-0">
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </Button>
        )}
      </div>
      {technicalDetail && (
        <div className="pl-8 pt-2">
          <button
            type="button"
            onClick={() => setDetailsOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-expanded={detailsOpen}
          >
            <ChevronDown
              className={cn('h-3 w-3 transition-transform', detailsOpen && 'rotate-180')}
            />
            {detailsOpen ? 'Hide technical details' : 'Show technical details'}
          </button>
          {detailsOpen && (
            <pre className="mt-2 bg-muted/50 rounded-md p-3 text-left text-xs text-muted-foreground whitespace-pre-wrap break-all max-h-48 overflow-auto">
              {technicalDetail}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

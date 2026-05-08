import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  AlertTriangle,
  ChevronDown,
  Home,
  RotateCcw,
  ServerCrash,
  WifiOff,
} from 'lucide-react'
import { cva } from 'class-variance-authority'

import type { ErrorKind, FriendlyError } from '@/lib/error-utils'
import { cn } from '@/lib/utils'
import { classifyError, getTechnicalDetail } from '@/lib/error-utils'
import { Button } from '@/components/ui/button'
import { NGS360Logo } from '@/components/ngs360-logo'

const accentBgVariants = cva('inline-flex items-center justify-center w-16 h-16 rounded-full', {
  variants: {
    kind: {
      server: 'bg-destructive/10',
      network: 'bg-amber-500/10',
      client: 'bg-muted',
      unknown: 'bg-muted',
    },
  },
  defaultVariants: {
    kind: 'unknown',
  },
})

const accentIconVariants = cva('w-8 h-8', {
  variants: {
    kind: {
      server: 'text-destructive',
      network: 'text-amber-600 dark:text-amber-400',
      client: 'text-foreground',
      unknown: 'text-foreground',
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

export interface ErrorStateProps {
  error: unknown
  onRetry?: () => void
  friendly?: FriendlyError
  fullscreen?: boolean
  className?: string
}

export function ErrorState({
  error,
  onRetry,
  friendly,
  fullscreen = false,
  className,
}: ErrorStateProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const info = friendly ?? classifyError(error)
  const Icon = iconFor(info.kind)

  const technicalDetail = getTechnicalDetail(error, info)

  return (
    <div
      className={cn(
        'flex items-center justify-center p-6',
        fullscreen
          ? 'relative min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary-2/5 overflow-hidden'
          : 'min-h-[60vh] py-12',
        className,
      )}
    >
      <div className="relative z-10 w-full max-w-xl text-center space-y-6">
        {fullscreen && (
          <div className="flex justify-center mb-4">
            <NGS360Logo />
          </div>
        )}

        <div className={accentBgVariants({ kind: info.kind })}>
          <Icon className={accentIconVariants({ kind: info.kind })} strokeWidth={2} />
        </div>

        <div className="space-y-2">
          <h1
            className={cn(
              'font-bold tracking-tight',
              fullscreen ? 'text-4xl md:text-5xl' : 'text-2xl md:text-3xl',
            )}
          >
            {info.title}
          </h1>
          <p className="text-base text-muted-foreground max-w-md mx-auto">
            {info.description}
          </p>
        </div>

        {info.status !== undefined && (
          <p className="text-xs text-muted-foreground">
            Error code: <span className="font-mono font-medium">{info.status}</span>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 max-w-sm mx-auto">
          {onRetry && (
            <Button onClick={onRetry} className="sm:flex-1">
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
          )}
          <Button
            asChild
            variant={onRetry ? 'outline' : 'default'}
            className="sm:flex-1"
          >
            <Link to="/">
              <Home className="h-4 w-4" />
              Return to Home
            </Link>
          </Button>
        </div>

        {technicalDetail && (
          <div className="pt-2">
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
              <pre className="mt-2 bg-muted/50 rounded-lg p-4 text-left text-xs text-muted-foreground whitespace-pre-wrap break-all max-h-48 overflow-auto max-w-lg mx-auto">
                {technicalDetail}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

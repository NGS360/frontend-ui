import { Info } from 'lucide-react'
import { useState } from 'react'

import { Spinner } from '@/components/spinner'
import { Button } from '@/components/ui/button'

interface TableProgressBannerProps {
  loadedCount: number
  totalCount: number | null
  /** Singular noun used in the message, e.g. "sample". Pluralized as `${noun}s`. */
  noun?: string
}

/** Info-styled banner shown between the toolbar and the table body while a
 * paginated dataset is still streaming in. The background doubles as a
 * progress bar — a darker blue fill grows from the left as more items land.
 * Layout is a three-column grid: info icon on the left, centered spinner +
 * progress text in the middle, and a link-styled dismiss action on the
 * right. Dismiss state is local. */
export function TableProgressBanner({
  loadedCount,
  totalCount,
  noun = 'item',
}: TableProgressBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const total = totalCount?.toLocaleString() ?? '…'
  const percent =
    totalCount && totalCount > 0
      ? Math.min(100, Math.max(0, (loadedCount / totalCount) * 100))
      : 0

  return (
    <div
      className='relative overflow-hidden rounded-md border border-blue-200 bg-blue-50 text-blue-900'
      role='progressbar'
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className='absolute inset-y-0 left-0 bg-blue-200 transition-[width] duration-300 ease-out'
        style={{ width: `${percent}%` }}
        aria-hidden='true'
      />
      <div className='relative grid grid-cols-3 items-center px-3 py-1.5'>
        <div className='flex items-center justify-start'>
          <Info className='size-4 text-blue-600' />
        </div>
        <div className='flex items-center justify-center gap-2'>
          <Spinner variant='circle' size={14} className='text-blue-600' />
          <span className='text-xs'>
            Loaded {loadedCount.toLocaleString()} of {total} {noun}s…
          </span>
        </div>
        <div className='flex items-center justify-end'>
          <Button
            variant='link'
            size='sm'
            className='h-auto p-0 text-xs text-blue-700'
            onClick={() => setDismissed(true)}
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  )
}

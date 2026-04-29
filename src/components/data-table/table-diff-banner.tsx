import { Info } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface TableDiffBannerProps {
  message?: string
  onDismiss: () => void
}

/** Info-styled banner shown between the toolbar and the table body while a
 * samplesheet diff is active. */
export function TableDiffBanner({
  message = 'Showing sample sheet diff',
  onDismiss,
}: TableDiffBannerProps) {
  return (
    <div className='relative overflow-hidden rounded-md border border-blue-200 bg-blue-50 text-blue-900'>
      <div className='relative grid grid-cols-3 items-center px-3 py-1.5'>
        <div className='flex items-center justify-start'>
          <Info className='size-4 text-blue-600' />
        </div>
        <div className='flex items-center justify-center'>
          <span className='text-xs'>{message}</span>
        </div>
        <div className='flex items-center justify-end'>
          <Button
            variant='link'
            size='sm'
            className='h-auto p-0 text-xs text-blue-700'
            onClick={onDismiss}
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  )
}

import { useCallback, useEffect, useRef } from 'react'
import type { RowData } from '@tanstack/react-table'

/**
 * TanStack's recommended pattern for selectively opting out of
 * `autoResetPageIndex`. Pass the returned boolean as `autoResetPageIndex`
 * and call `skip()` immediately before an in-place data change you do *not*
 * want to reset the page (e.g. an inline cell edit). Filter and sort
 * changes still reset normally.
 */
export function useSkipper(): readonly [boolean, () => void] {
  const shouldResetRef = useRef(true)
  const skip = useCallback(() => {
    shouldResetRef.current = false
  }, [])
  useEffect(() => {
    shouldResetRef.current = true
  })
  return [shouldResetRef.current, skip] as const
}

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    skipAutoResetPageIndex?: () => void
  }
}

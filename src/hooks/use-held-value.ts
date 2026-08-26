import { useEffect, useRef, useState } from 'react'

/**
 * A value that refuses to change more often than `holdMs`.
 *
 * For labels driven by something faster than a person can read. Changes are
 * delayed, never dropped, so the newest value always wins once the hold expires.
 */
export function useHeldValue<T>(value: T, holdMs: number): T {
  const [shown, setShown] = useState(value)
  // When `shown` last changed. Mount time, not 0 — otherwise the first change
  // looks infinitely overdue and applies instantly, flashing past unread.
  const changedAt = useRef(Date.now())

  useEffect(() => {
    if (value === shown) return
    const wait = Math.max(0, holdMs - (Date.now() - changedAt.current))
    const timer = setTimeout(() => {
      changedAt.current = Date.now()
      setShown(value)
    }, wait)
    return () => clearTimeout(timer)
  }, [value, shown, holdMs])

  return shown
}

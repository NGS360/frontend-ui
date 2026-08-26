import { createElement } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { sha256 } from 'js-sha256'
import type { ClassValue } from 'clsx'
import type { ReactNode } from 'react'

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a byte count as a human-readable size (e.g. "0 B", "1.5 KB",
 * "3.4 MB"). Trailing zeros are trimmed; `decimals` caps the fraction digits.
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = Math.max(0, decimals)
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const idx = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(dm))} ${sizes[idx]}`
}

/**
 * Safely formats a date string as a localized date + time (via toLocaleString).
 * Returns "-" for empty, "-", or unparseable input.
 */
export function formatDateTime(dateString: string): string {
  if (!dateString || dateString === '-') return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleString()
  } catch {
    return '-'
  }
}

/**
 * Formats a timestamp as a short relative time string (e.g. "5m ago", "3h ago",
 * "2d ago"), falling back to a localized date for anything older than a week.
 */
export function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < hour) {
    const mins = Math.max(1, Math.round(diff / minute))
    return `${mins}m ago`
  }
  if (diff < day) return `${Math.round(diff / hour)}h ago`
  if (diff < 7 * day) return `${Math.round(diff / day)}d ago`
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function isValidHttpURL(text: string | null) {
  if (!text) return false
  try {
    const url = new URL(text)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch (e) {
    return false
  }
}

/**
 * Highlights matching text by wrapping it in <strong> tags with text-foreground color
 * @param text - The text to search within
 * @param query - The search query to highlight
 * @returns ReactNode with highlighted matches
 */
export function highlightMatch(text: string, query: string): ReactNode {
  if (!query.trim()) return text
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  
  return parts.map((part, index) => 
    regex.test(part) 
      ? createElement('strong', { key: index, className: 'text-foreground' }, part)
      : part
  )
}

// Trim ws & convert to lower for correct hash string
// Create a SHA256 hash of the final string
function hashEmail(email: string): string {
  const address = String(email).trim().toLowerCase()
  return sha256(address)
}

// Get URL for a user's Gravatar
export function getGravatarUrl(email: string): string {
  const hash = hashEmail(email)
  return `https://www.gravatar.com/avatar/${hash}?size=800&d=identicon`
}

import { createElement } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ClassValue } from 'clsx'
import type { ReactNode } from 'react'

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
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

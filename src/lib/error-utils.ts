import { AxiosError } from 'axios'
import { toast } from 'sonner'

export type ErrorKind = 'server' | 'network' | 'client' | 'unknown'

export interface FriendlyError {
  kind: ErrorKind
  status?: number
  title: string
  description: string
  detail?: string
}

function extractDetail(err: AxiosError<{ detail?: unknown } | undefined>): string | undefined {
  const raw = err.response?.data?.detail
  if (typeof raw === 'string' && raw.trim()) return raw
  if (Array.isArray(raw) && raw.length > 0) {
    const first = raw[0] as { msg?: string } | string | undefined
    if (typeof first === 'string') return first
    if (first && typeof first === 'object' && typeof first.msg === 'string') return first.msg
  }
  return undefined
}

function specificFriendlyError(status: number, detail: string | undefined): FriendlyError | undefined {
  switch (status) {
    case 400:
      return {
        kind: 'client',
        status,
        title: "That request wasn't accepted",
        description:
          detail ?? "The server couldn't process this request. Please review your input and try again.",
        detail,
      }
    case 401:
      return {
        kind: 'client',
        status,
        title: 'Your session has expired',
        description: detail ?? 'Please sign in again to continue.',
        detail,
      }
    case 403:
      return {
        kind: 'client',
        status,
        title: "You don't have access to this",
        description:
          detail ??
          "Your account doesn't have permission for this action. If you believe this is a mistake, please contact a system administrator or support.",
        detail,
      }
    case 404:
      return {
        kind: 'client',
        status,
        title: "We couldn't find that",
        description:
          detail ?? "The item you're looking for may have been moved, renamed, or deleted.",
        detail,
      }
    case 409:
      return {
        kind: 'client',
        status,
        title: 'This conflicts with existing data',
        description:
          detail ??
          'Another record already exists with these details, or the item was changed by someone else. Refresh and try again.',
        detail,
      }
    case 422:
      return {
        kind: 'client',
        status,
        title: 'Some fields need attention',
        description: detail ?? 'Please review the highlighted fields and try again.',
        detail,
      }
    case 429:
      return {
        kind: 'client',
        status,
        title: "You're doing that too fast",
        description: detail ?? 'Please wait a moment and try again.',
        detail,
      }
    case 502:
    case 503:
    case 504:
      return {
        kind: 'server',
        status,
        title: 'The service is temporarily unavailable',
        description:
          detail ??
          'Our servers are taking longer than usual to respond. Please try again in a few moments. If the problem persists, contact support.',
        detail,
      }
    default:
      return undefined
  }
}

export function classifyError(error: unknown): FriendlyError {
  if (error instanceof AxiosError) {
    const status = error.response?.status
    const detail = extractDetail(error as AxiosError<{ detail?: unknown }>)

    if (!error.response) {
      return {
        kind: 'network',
        title: "We couldn't reach the server",
        description:
          'Check your internet connection and try again. If the problem persists, the service may be briefly offline.',
      }
    }

    if (status !== undefined) {
      const specific = specificFriendlyError(status, detail)
      if (specific) return specific
    }

    if (status !== undefined && status >= 500) {
      return {
        kind: 'server',
        status,
        title: 'Our servers ran into a problem',
        description:
          "This isn't your fault. Something went wrong on our end — we've been notified and are looking into it. Please try again in a moment.",
        detail,
      }
    }

    if (status !== undefined && status >= 400) {
      return {
        kind: 'client',
        status,
        title: 'The request could not be completed',
        description: detail ?? 'The server rejected the request. Please review your input and try again.',
        detail,
      }
    }
  }

  const message = error instanceof Error ? error.message : undefined
  return {
    kind: 'unknown',
    title: 'Something went wrong',
    description:
      message ?? 'An unexpected error occurred. Please try again, or reload the page if the problem continues.',
    detail: message,
  }
}

export function isServerError(error: unknown): boolean {
  return error instanceof AxiosError && (error.response?.status ?? 0) >= 500
}

/**
 * Describe an error for the "Show technical details" panel in a way that's
 * useful to forward to a support person. Prefers the backend's `detail`
 * message; for AxiosErrors with no detail, describes the HTTP exchange
 * (method, URL, status) rather than the JS stack — so a 503 reads as a
 * backend problem, not an "AxiosError". Falls back to stack/message for
 * non-Axios errors.
 */
export function getTechnicalDetail(error: unknown, info: FriendlyError): string {
  if (info.detail) return info.detail
  if (error instanceof AxiosError) {
    const method = error.config?.method?.toUpperCase() ?? 'REQUEST'
    const url = error.config?.url ?? '(unknown URL)'
    if (error.response) {
      const statusText = error.response.statusText || ''
      return `HTTP ${error.response.status} ${statusText}`.trim() + ` from ${method} ${url}\nThe server did not provide additional details.`
    }
    return `${method} ${url}\nNo response from server: ${error.message}`
  }
  if (error instanceof Error) return error.stack ?? error.message
  return String(error)
}

/**
 * Show a friendly error toast. For 5xx/network errors, uses the generic
 * friendly text; for 4xx, prefers the server's `detail` message; otherwise
 * falls back to the caller-supplied title (e.g. "Failed to create API key").
 */
export function toastApiError(error: unknown, fallbackTitle: string): void {
  const info = classifyError(error)
  if (info.kind === 'server' || info.kind === 'network') {
    toast.error(info.title, { description: info.description })
    return
  }
  toast.error(info.detail ?? fallbackTitle)
}

/**
 * Return a single-line error message suitable for inline form display
 * (e.g. react-hook-form's `setError('root', { message })`).
 */
export function getFormApiErrorMessage(error: unknown, fallbackTitle: string): string {
  const info = classifyError(error)
  if (info.kind === 'server' || info.kind === 'network') return info.description
  return info.detail ?? fallbackTitle
}

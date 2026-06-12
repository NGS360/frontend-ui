/**
 * HTTP error thrown by the generated fetch client. Constructed in the
 * client's error interceptor (see interceptors.ts) so app code always
 * receives the status code, parsed body, and request context together —
 * the same information AxiosError used to carry.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly statusText: string,
    readonly body: unknown,
    readonly method: string,
    readonly url: string,
  ) {
    super(`HTTP ${status} ${statusText}`.trim() + ` from ${method} ${url}`)
    this.name = 'ApiError'
  }
}

/**
 * The server could not be reached at all (connection refused, DNS failure,
 * offline). Wraps fetch's bare TypeError with the request context.
 * Thrown by fetchWithAuth; aborts are NOT wrapped (they surface as
 * AbortError so callers can distinguish cancellation).
 */
export class NetworkError extends Error {
  constructor(
    readonly method: string,
    readonly url: string,
    cause: unknown,
  ) {
    super(cause instanceof Error ? cause.message : String(cause))
    this.name = 'NetworkError'
  }
}

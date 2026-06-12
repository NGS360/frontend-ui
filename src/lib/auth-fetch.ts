import { NetworkError } from './api-error'
import { getAccessToken, refreshAccessToken } from './auth-token'

// A 401 from these endpoints must never trigger a session refresh: a failed
// login is just a failed login, and a 401 from the refresh endpoint *inside*
// refreshAccessToken() would await its own single-flight promise and deadlock.
const AUTH_ENDPOINTS = ['/api/v1/auth/login', '/api/v1/auth/refresh']

/**
 * The app's authenticated fetch: attaches the Bearer token, and on a 401
 * refreshes the session (single-flight, via auth-token.ts) and retries the
 * request once. Connection failures are wrapped into NetworkError with the
 * request context; aborts pass through as AbortError.
 *
 * This is the `fetch` implementation for the generated hey-api client (see
 * interceptors.ts) and for anything else fetch-based, e.g. the AI chat
 * transport — one auth path for every request the app makes.
 */
export const fetchWithAuth: typeof fetch = async (input, init) => {
  const url = input instanceof Request ? input.url : String(input)
  const method = (
    init?.method ?? (input instanceof Request ? input.method : 'GET')
  ).toUpperCase()

  const send = async (freshToken?: string) => {
    const baseHeaders =
      init?.headers ?? (input instanceof Request ? input.headers : undefined)
    const headers = new Headers(baseHeaders)
    const token = freshToken ?? getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    try {
      // Clone Request inputs so the body is still consumable on the retry
      return await fetch(input instanceof Request ? input.clone() : input, {
        ...init,
        headers,
      })
    } catch (error) {
      if (error instanceof TypeError) {
        throw new NetworkError(method, url, error)
      }
      throw error
    }
  }

  const response = await send()
  if (response.status !== 401) return response
  if (AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint))) {
    return response
  }

  let newToken: string
  try {
    newToken = await refreshAccessToken()
  } catch {
    return response // session expired — surface the original 401
  }
  return send(newToken)
}

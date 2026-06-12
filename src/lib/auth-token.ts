import { refreshToken as refreshTokenApi } from '../client/sdk.gen'
import { STORAGE_KEYS } from '../context/auth-context'

let refreshPromise: Promise<string> | null = null

export function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
}

/**
 * Refresh the access token, deduplicating concurrent callers onto a single
 * in-flight request — callers that arrive while a refresh is running await
 * the same promise. On success the new tokens are persisted; on failure the
 * session is cleared and `auth:session-expired` is dispatched.
 */
export function refreshAccessToken(): Promise<string> {
  refreshPromise ??= doRefresh().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

async function doRefresh(): Promise<string> {
  try {
    const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
    if (!storedRefreshToken) throw new Error('No refresh token available')

    const { data } = await refreshTokenApi({
      throwOnError: true,
      body: { refresh_token: storedRefreshToken },
    })

    const expiresAt = Date.now() + data.expires_in * 1000
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token)
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token)
    localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString())

    return data.access_token
  } catch (error) {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT)
    window.dispatchEvent(new Event('auth:session-expired'))
    throw error
  }
}

import { getDownloadUrl } from '../client/sdk.gen'

/**
 * Send the browser to a presigned URL for a file in object storage.
 *
 * Why not just navigate to `GET /api/v1/files/download`: that endpoint answers
 * with a 307 to the same presigned URL, but a browser following a link cannot
 * attach an Authorization header, so it can never be permission-checked — every
 * download the app made arrived at the API as an anonymous request.
 * `GET /api/v1/files/download-url` returns the URL as JSON instead, so the
 * request carrying the token is one fetchWithAuth can sign. The bytes still come
 * straight from object storage, exactly as before.
 *
 * Throws ApiError on a non-2xx response and NetworkError if the API is
 * unreachable, so callers can hand either to toastApiError. Both come from the
 * generated client: every SDK request goes out through fetchWithAuth and its
 * error interceptor builds the ApiError (see lib/interceptors.ts).
 */
export async function downloadStorageFile(path: string): Promise<void> {
  // Opened synchronously, before the first await, and therefore still inside the
  // click that triggered it. A window.open() after an await has lost the
  // user-gesture context and counts as an unsolicited popup — Safari blocks it
  // outright. Do not move this below the fetch.
  const downloadWindow = window.open('', '_blank')

  try {
    const { data } = await getDownloadUrl({
      query: { path },
      throwOnError: true,
    })

    if (downloadWindow) {
      downloadWindow.location.href = data.url
    } else {
      // The pre-opened tab was blocked anyway. Fall back to this one: the
      // response is a file, so the browser downloads it and stays put.
      window.location.href = data.url
    }
  } catch (error) {
    // Leaving a blank tab open after a failure looks like the app hung.
    downloadWindow?.close()
    throw error
  }
}

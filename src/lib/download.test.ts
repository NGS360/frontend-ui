import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from './api-error'
import { downloadStorageFile } from './download'

const fetchWithAuth = vi.hoisted(() => vi.fn())
vi.mock('./auth-fetch', () => ({ fetchWithAuth }))

const PATH = 's3://bucket/project/P-1/reads.fastq.gz'
const PRESIGNED = 'https://bucket.s3.amazonaws.com/reads.fastq.gz?X-Amz-Signature=abc'

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return {
    ok: (init.status ?? 200) < 400,
    status: init.status ?? 200,
    statusText: init.statusText ?? 'OK',
    json: async () => body,
  } as unknown as Response
}

/** A stand-in for the tab window.open() hands back. */
function fakeWindow() {
  return { location: { href: '' }, close: vi.fn() } as unknown as Window
}

describe('downloadStorageFile', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    fetchWithAuth.mockReset()
  })

  it('asks the API for a presigned URL rather than navigating to the redirect', async () => {
    vi.spyOn(window, 'open').mockReturnValue(fakeWindow())
    fetchWithAuth.mockResolvedValue(jsonResponse({ url: PRESIGNED, expires_in: 3600 }))

    await downloadStorageFile(PATH)

    const endpoint = fetchWithAuth.mock.calls[0][0] as string
    expect(endpoint).toContain('/api/v1/files/download-url')
    // The old, unauthenticatable route must not be used.
    expect(endpoint).not.toMatch(/\/files\/download\?/)
    expect(endpoint).toContain(encodeURIComponent(PATH))
  })

  it('sends the pre-opened tab to the presigned URL', async () => {
    const tab = fakeWindow()
    vi.spyOn(window, 'open').mockReturnValue(tab)
    fetchWithAuth.mockResolvedValue(jsonResponse({ url: PRESIGNED, expires_in: 3600 }))

    await downloadStorageFile(PATH)

    expect(tab.location.href).toBe(PRESIGNED)
  })

  it('opens the tab before awaiting, so the click still counts as a gesture', async () => {
    // Safari blocks a window.open() that happens after an await, treating it as
    // an unsolicited popup. Assert the ordering, not just the outcome.
    const order: Array<string> = []
    vi.spyOn(window, 'open').mockImplementation(() => {
      order.push('open')
      return fakeWindow()
    })
    fetchWithAuth.mockImplementation(() => {
      order.push('fetch')
      return Promise.resolve(jsonResponse({ url: PRESIGNED, expires_in: 3600 }))
    })

    await downloadStorageFile(PATH)

    expect(order).toEqual(['open', 'fetch'])
  })

  it('falls back to the current tab when the popup was blocked', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null)
    fetchWithAuth.mockResolvedValue(jsonResponse({ url: PRESIGNED, expires_in: 3600 }))
    // jsdom will not navigate, but the assignment is observable.
    const assign = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { set href(value: string) { assign(value) } },
    })

    await downloadStorageFile(PATH)

    expect(assign).toHaveBeenCalledWith(PRESIGNED)
  })

  it('throws ApiError and closes the blank tab when the API refuses', async () => {
    const tab = fakeWindow()
    vi.spyOn(window, 'open').mockReturnValue(tab)
    fetchWithAuth.mockResolvedValue(
      jsonResponse({ detail: 'Missing permission: file:download' },
                   { status: 403, statusText: 'Forbidden' }),
    )

    await expect(downloadStorageFile(PATH)).rejects.toBeInstanceOf(ApiError)
    // A blank tab left open after a failure looks like the app hung.
    expect(tab.close).toHaveBeenCalled()
  })

  it('closes the blank tab when the API is unreachable', async () => {
    const tab = fakeWindow()
    vi.spyOn(window, 'open').mockReturnValue(tab)
    fetchWithAuth.mockRejectedValue(new Error('offline'))

    await expect(downloadStorageFile(PATH)).rejects.toThrow('offline')
    expect(tab.close).toHaveBeenCalled()
  })

  it('still throws when the error body is not JSON', async () => {
    vi.spyOn(window, 'open').mockReturnValue(fakeWindow())
    fetchWithAuth.mockResolvedValue({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      json: async () => {
        throw new Error('not json')
      },
    } as unknown as Response)

    await expect(downloadStorageFile(PATH)).rejects.toBeInstanceOf(ApiError)
  })
})

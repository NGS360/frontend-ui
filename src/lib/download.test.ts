import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from './api-error'
import { downloadStorageFile } from './download'

const getDownloadUrl = vi.hoisted(() => vi.fn())
vi.mock('../client/sdk.gen', () => ({ getDownloadUrl }))

const PATH = 's3://bucket/project/P-1/reads.fastq.gz'
const PRESIGNED = 'https://bucket.s3.amazonaws.com/reads.fastq.gz?X-Amz-Signature=abc'

/** What the generated SDK resolves to on success. */
function sdkResponse(url = PRESIGNED, expiresIn = 3600) {
  return { data: { url, expires_in: expiresIn } }
}

/** A stand-in for the tab window.open() hands back. */
function fakeWindow() {
  return { location: { href: '' }, close: vi.fn() } as unknown as Window
}

describe('downloadStorageFile', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    getDownloadUrl.mockReset()
  })

  it('asks the API for a presigned URL rather than navigating to the redirect', async () => {
    vi.spyOn(window, 'open').mockReturnValue(fakeWindow())
    getDownloadUrl.mockResolvedValue(sdkResponse())

    await downloadStorageFile(PATH)

    // Calling the generated getDownloadUrl is what keeps this on the
    // authenticated route: the old /files/download redirect cannot carry a token.
    expect(getDownloadUrl).toHaveBeenCalledWith({
      query: { path: PATH },
      throwOnError: true,
    })
  })

  it('sends the pre-opened tab to the presigned URL', async () => {
    const tab = fakeWindow()
    vi.spyOn(window, 'open').mockReturnValue(tab)
    getDownloadUrl.mockResolvedValue(sdkResponse())

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
    getDownloadUrl.mockImplementation(() => {
      order.push('fetch')
      return Promise.resolve(sdkResponse())
    })

    await downloadStorageFile(PATH)

    expect(order).toEqual(['open', 'fetch'])
  })

  it('falls back to the current tab when the popup was blocked', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null)
    getDownloadUrl.mockResolvedValue(sdkResponse())
    // jsdom will not navigate, but the assignment is observable.
    const assign = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        set href(value: string) {
          assign(value)
        },
      },
    })

    await downloadStorageFile(PATH)

    expect(assign).toHaveBeenCalledWith(PRESIGNED)
  })

  it('throws ApiError and closes the blank tab when the API refuses', async () => {
    const tab = fakeWindow()
    vi.spyOn(window, 'open').mockReturnValue(tab)
    // throwOnError: true makes the SDK reject with what the error interceptor
    // built, which is an ApiError.
    getDownloadUrl.mockRejectedValue(
      new ApiError(
        403,
        'Forbidden',
        { detail: 'Missing permission: file:download' },
        'GET',
        '/api/v1/files/download-url',
      ),
    )

    await expect(downloadStorageFile(PATH)).rejects.toBeInstanceOf(ApiError)
    // A blank tab left open after a failure looks like the app hung.
    expect(tab.close).toHaveBeenCalled()
  })

  it('closes the blank tab when the API is unreachable', async () => {
    const tab = fakeWindow()
    vi.spyOn(window, 'open').mockReturnValue(tab)
    getDownloadUrl.mockRejectedValue(new Error('offline'))

    await expect(downloadStorageFile(PATH)).rejects.toThrow('offline')
    expect(tab.close).toHaveBeenCalled()
  })
})

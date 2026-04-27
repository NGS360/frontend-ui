import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

/**
 * Generic paginated response type
 * Matches the structure returned by the API for paginated endpoints
 */
export interface PaginatedResponse<T> {
  data: Array<T>
  total_items: number
  total_pages: number
  current_page: number
  per_page: number
  has_next: boolean
  has_prev: boolean
}

/**
 * Parameters for pagination queries
 */
export interface PaginationParams {
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

/**
 * Fetcher function type that returns a paginated response
 */
export type PaginatedFetcher<T> = (params: {
  query: PaginationParams
}) => Promise<{ data?: PaginatedResponse<T> }>

/**
 * Options for the useAllPaginated hook
 */
export interface UseAllPaginatedOptions<T> {
  /** Unique query key for React Query cache */
  queryKey: Array<unknown>
  /** Function that fetches a single page of data */
  fetcher: PaginatedFetcher<T>
  /** Items per page for the bulk fetch (pages 2..N when firstPagePerPage is
   * unset/equal, or pages 1..N when they differ). Default: 500. */
  perPage?: number
  /** Items per page for the initial fetch only. Use a small value (e.g. 50)
   * for fast first paint. When this differs from `perPage`, the rest fetch
   * re-requests items 0..firstPagePerPage-1 — the overlap is intentional and
   * lets the consumer transition seamlessly to the larger-page coverage.
   * Defaults to `perPage`. */
  firstPagePerPage?: number
  /** Maximum concurrent in-flight requests for the bulk fetch (default: 12). */
  concurrency?: number
  /** How long to consider data fresh in milliseconds */
  staleTime?: number
  /** How long to keep data in cache in milliseconds */
  gcTime?: number
  /** Whether the query is enabled (default: true) */
  enabled?: boolean
}

export interface UseAllPaginatedResult<T> {
  /** All items loaded so far. Grows as additional pages stream in. */
  data: Array<T>
  /** True until the first page resolves. */
  isLoading: boolean
  /** True while pages 2..N are still streaming in. */
  isFetchingMore: boolean
  /** True once every page has been loaded. */
  isComplete: boolean
  /** Convenience: data.length. */
  loadedCount: number
  /** Total number of items reported by the first page response. */
  totalCount: number | null
  /** First error encountered, if any. */
  error: Error | null
  /** Re-run the entire fetch flow. */
  refetch: () => void
}

const stableKey = (key: Array<unknown>): string => JSON.stringify(key)

/**
 * Generic hook to fetch all pages from a paginated API endpoint.
 *
 * Fetches page 1 via React Query, then fans out the remaining pages in
 * parallel through a concurrency-limited worker pool. The returned `data`
 * array grows as each page arrives, so consumers can render progressively
 * (e.g. a TanStack Table) instead of waiting for the full dataset.
 */
export function useAllPaginated<T>({
  queryKey,
  fetcher,
  perPage = 500,
  firstPagePerPage,
  concurrency = 1,
  staleTime,
  gcTime,
  enabled = true,
}: UseAllPaginatedOptions<T>): UseAllPaginatedResult<T> {
  const queryClient = useQueryClient()

  const firstSize = firstPagePerPage ?? perPage
  // When the first-page size matches the bulk size, page 1 of the bulk fetch
  // is already in hand — start the bulk fetch at page 2 and prepend the
  // first-page data on output. When sizes differ, page 1 is just a small
  // preview; the bulk fetch covers pages 1..N at perPage and supersedes the
  // preview as soon as its first page lands.
  const sameSize = firstSize === perPage

  const firstPageQuery = useQuery({
    queryKey: [...queryKey, 'page', 1, firstSize],
    queryFn: async () => {
      const response = await fetcher({
        query: { page: 1, per_page: firstSize },
      })
      if (!response.data) {
        throw new Error('Paginated fetcher returned no data for page 1')
      }
      return response.data
    },
    staleTime,
    gcTime,
    enabled,
  })

  const [restPages, setRestPages] = useState<Map<number, Array<T>>>(new Map())
  const [restError, setRestError] = useState<Error | null>(null)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [restComplete, setRestComplete] = useState(false)

  // Bumping this triggers a fresh re-run of the rest-pages effect.
  const [refetchTick, setRefetchTick] = useState(0)

  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  }, [fetcher])

  const keySig = stableKey(queryKey)
  const totalItems = firstPageQuery.data?.total_items ?? null
  // Total pages computed at the bulk-fetch page size, regardless of firstSize.
  const bulkTotalPages =
    totalItems !== null ? Math.max(1, Math.ceil(totalItems / perPage)) : null

  useEffect(() => {
    if (!enabled) return
    if (bulkTotalPages === null || totalItems === null) return

    const startPage = sameSize ? 2 : 1
    const endPage = bulkTotalPages

    // First page already covers everything we need.
    if (
      (sameSize && endPage <= 1) ||
      (!sameSize && totalItems <= firstSize && endPage <= 1)
    ) {
      setRestPages(new Map())
      setRestError(null)
      setIsFetchingMore(false)
      setRestComplete(true)
      return
    }

    const controller = new AbortController()
    const isAborted = (): boolean => controller.signal.aborted
    setRestPages(new Map())
    setRestError(null)
    setRestComplete(false)
    setIsFetchingMore(true)

    const queue: Array<number> = []
    for (let p = startPage; p <= endPage; p++) queue.push(p)

    const fetchPage = async (page: number): Promise<PaginatedResponse<T>> => {
      const result = await queryClient.fetchQuery({
        queryKey: [...queryKey, 'page', page, perPage],
        queryFn: async () => {
          const response = await fetcherRef.current({
            query: { page, per_page: perPage },
          })
          if (!response.data) {
            throw new Error(`Paginated fetcher returned no data for page ${page}`)
          }
          return response.data
        },
        staleTime,
        gcTime,
      })
      return result
    }

    const worker = async () => {
      while (!isAborted()) {
        const page = queue.shift()
        if (page === undefined) return
        try {
          const resp = await fetchPage(page)
          if (isAborted()) return
          setRestPages((prev) => {
            const next = new Map(prev)
            next.set(page, resp.data)
            return next
          })
        } catch (err) {
          if (isAborted()) return
          setRestError(err instanceof Error ? err : new Error(String(err)))
          queue.length = 0
          return
        }
      }
    }

    const workerCount = Math.min(concurrency, queue.length)
    const workers = Array.from({ length: workerCount }, () => worker())

    void Promise.all(workers).then(() => {
      if (isAborted()) return
      setIsFetchingMore(false)
      setRestComplete(true)
    })

    return () => {
      controller.abort()
    }
    // keySig captures queryKey identity; refetchTick forces a re-run on refetch().
  }, [
    keySig,
    perPage,
    firstSize,
    sameSize,
    concurrency,
    bulkTotalPages,
    totalItems,
    enabled,
    refetchTick,
    queryClient,
    staleTime,
    gcTime,
  ])

  const data = useMemo(() => {
    const firstPageData = firstPageQuery.data?.data
    if (!firstPageData) return []
    if (sameSize) {
      if (restPages.size === 0) return firstPageData
      const sorted = Array.from(restPages.entries()).sort(([a], [b]) => a - b)
      const out: Array<T> = [...firstPageData]
      for (const [, items] of sorted) out.push(...items)
      return out
    }
    // Differing sizes: bulk fetch covers everything from page 1. Show the
    // small preview until the bulk fetch's page 1 lands, then transition.
    if (!restPages.has(1)) return firstPageData
    const sorted = Array.from(restPages.entries()).sort(([a], [b]) => a - b)
    const out: Array<T> = []
    for (const [, items] of sorted) out.push(...items)
    return out
  }, [firstPageQuery.data, restPages, sameSize])

  const refetch = useCallback(() => {
    firstPageQuery.refetch()
    setRefetchTick((n) => n + 1)
  }, [firstPageQuery])

  const totalCount = totalItems
  const error = firstPageQuery.error ?? restError
  const isComplete = firstPageQuery.isSuccess && restComplete

  return {
    data,
    isLoading: firstPageQuery.isLoading,
    isFetchingMore,
    isComplete,
    loadedCount: data.length,
    totalCount,
    error,
    refetch,
  }
}

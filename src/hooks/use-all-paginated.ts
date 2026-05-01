import { useEffect, useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'

/**
 * Generic paginated response type.
 * The hook only requires `data`, `total_items`, and `has_next`; other fields
 * are optional so endpoints with slightly different shapes can adapt.
 */
export interface PaginatedResponse<T> {
  data: Array<T>
  total_items: number
  has_next: boolean
  has_prev?: boolean
  skip?: number
  limit?: number
  data_cols?: Array<string> | null
}

/**
 * Query parameters the hook will pass to the fetcher.
 */
export interface PaginationParams {
  skip?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

/**
 * Fetcher function type. Endpoints whose query shape doesn't match
 * skip/limit can be adapted at the call site by wrapping the fetcher.
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
  /** Items per page for the bulk fetch (default: 250). Smaller values yield
   * smoother progress indication; larger values reduce total round-trips. */
  perPage?: number
  /** Items per page for the very first request, used to optimize first paint.
   * If smaller than `perPage`, the bulk fetch resumes from where the preview
   * ends — no overlap, no gap. Defaults to `perPage`. */
  firstPagePerPage?: number
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

interface PageParam {
  skip: number
  limit: number
}

/**
 * Generic hook to fetch all pages from a paginated API endpoint.
 *
 * Backed by TanStack Query's `useInfiniteQuery`: pages are fetched
 * sequentially via the built-in `fetchNextPage` machinery, and an effect
 * auto-advances until `has_next` reports false. The flattened `data` array
 * grows as each page lands, so consumers can render progressively (e.g. a
 * TanStack Table) instead of waiting for the full dataset.
 *
 * When `firstPagePerPage` differs from `perPage`, the first request fetches
 * a small preview for fast first paint, then the bulk fetch resumes at
 * `skip = firstPagePerPage` with `limit = perPage`. Skip/limit pagination
 * lets the resume be exact — no overlap, no gap.
 */
export function useAllPaginated<T>({
  queryKey,
  fetcher,
  perPage = 250,
  firstPagePerPage,
  staleTime,
  gcTime,
  enabled = true,
}: UseAllPaginatedOptions<T>): UseAllPaginatedResult<T> {
  const firstSize = firstPagePerPage ?? perPage

  const query = useInfiniteQuery({
    queryKey: [...queryKey, 'all', perPage, firstSize],
    queryFn: async ({ pageParam }) => {
      const response = await fetcher({
        query: { skip: pageParam.skip, limit: pageParam.limit },
      })
      if (!response.data) {
        throw new Error(
          `Paginated fetcher returned no data for skip=${pageParam.skip}`,
        )
      }
      return response.data
    },
    initialPageParam: { skip: 0, limit: firstSize } as PageParam,
    getNextPageParam: (lastPage, _allPages, lastPageParam): PageParam | undefined => {
      if (!lastPage.has_next) return undefined
      return { skip: lastPageParam.skip + lastPageParam.limit, limit: perPage }
    },
    staleTime,
    gcTime,
    enabled,
  })

  const { hasNextPage, isFetchingNextPage, fetchNextPage, isSuccess } = query

  // Auto-advance through every page until the server reports has_next: false.
  useEffect(() => {
    if (!enabled) return
    if (!isSuccess) return
    if (!hasNextPage) return
    if (isFetchingNextPage) return
    void fetchNextPage()
  }, [enabled, isSuccess, hasNextPage, isFetchingNextPage, fetchNextPage])

  const data = useMemo<Array<T>>(() => {
    const pages = query.data?.pages
    if (!pages) return []
    return pages.flatMap((page) => page.data)
  }, [query.data])

  const totalCount = query.data?.pages[0]?.total_items ?? null
  const isComplete = isSuccess && !hasNextPage && !isFetchingNextPage

  return {
    data,
    isLoading: query.isLoading,
    isFetchingMore: isFetchingNextPage || (isSuccess && hasNextPage === true),
    isComplete,
    loadedCount: data.length,
    totalCount,
    error: query.error,
    refetch: () => {
      void query.refetch()
    },
  }
}

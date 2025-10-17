import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'

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
  /** Number of items to fetch per page (default: 100) */
  perPage?: number
  /** How long to consider data fresh in milliseconds (default: 5 minutes) */
  staleTime?: number
  /** How long to keep data in cache in milliseconds (default: 10 minutes) */
  gcTime?: number
  /** Whether the query is enabled (default: true) */
  enabled?: boolean
}

/**
 * Generic hook to fetch all pages from a paginated API endpoint
 * 
 * Fetches all pages sequentially and returns a flat array of all items.
 * Uses React Query for caching and automatic refetching.
 * 
 * @template T - The type of items in the paginated response
 * @param options - Configuration options for the hook
 * @returns React Query result with all items as a flat array
 * 
 * @example
 * ```tsx
 * const { data: vendors, isLoading } = useAllPaginated({
 *   queryKey: ['vendors', 'all'],
 *   fetcher: getVendors,
 *   perPage: 100,
 * });
 * ```
 */
export function useAllPaginated<T>({
  queryKey,
  fetcher,
  perPage = 100,
  staleTime = 0,
  gcTime = 0,
  enabled = true,
}: UseAllPaginatedOptions<T>): UseQueryResult<Array<T>, Error> {
  return useQuery({
    queryKey,
    queryFn: async (): Promise<Array<T>> => {
      const allItems: Array<T> = []
      let currentPage = 1
      let hasMore = true

      while (hasMore) {
        const response = await fetcher({
          query: {
            page: currentPage,
            per_page: perPage,
          },
        })

        if (response.data) {
          allItems.push(...response.data.data)
          hasMore = response.data.has_next
          currentPage++
        } else {
          hasMore = false
        }
      }

      return allItems
    },
    staleTime,
    gcTime,
    enabled,
  })
}

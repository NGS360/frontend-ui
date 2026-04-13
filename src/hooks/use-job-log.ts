import { useEffect, useMemo, useRef, useState } from 'react'
import {
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import type { LogResponse } from '@/client'
import { getJobLogPaginated } from '@/client'
import { getJobLogPaginatedQueryKey } from '@/client/@tanstack/react-query.gen'

// Adjust these constants for log fetching behavior
const LOG_PAGE_LIMIT = 100
const POLL_INTERVAL_MS = 5000
const FETCH_THRESHOLD_PX = 80
const INDICATOR_THRESHOLD_MIN_PX = 400
const INDICATOR_THRESHOLD_RATIO = 0.20

// --------------------------------------------------------------------------
// Hook: useJobLog
//
// Manages paginated log fetching for a batch job with two modes:
//
//   Live mode  (job is RUNNING):
//     - Auto-walks all existing pages on mount
//     - Polls every 5s for new events (append-only, no re-fetch)
//     - Auto-scrolls viewport to bottom when pinned
//
//   Browse mode (job is SUCCEEDED / FAILED / etc.):
//     - Loads only the initial page
//     - User scrolls to load more (infinite scroll)
//     - Shows "Scroll to load more" indicator near the bottom
// --------------------------------------------------------------------------

export function useJobLog(jobId: string, isLive: boolean) {
  const queryClient = useQueryClient()

  // ── Query setup ──────────────────────────────────────────────────────

  const queryKey = useMemo(
    () =>
      [
        ...getJobLogPaginatedQueryKey({
          path: { job_id: jobId },
          query: { limit: LOG_PAGE_LIMIT, start_from_head: true },
        }),
        'infinite',
      ] as const,
    [jobId],
  )

  const {
    data,
    error,
    status,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<
    LogResponse,
    Error,
    InfiniteData<LogResponse, string | undefined>,
    typeof queryKey,
    string | undefined
  >({
    queryKey,
    queryFn: async ({ pageParam, signal }) => {
      const { data: logData } = await getJobLogPaginated({
        path: { job_id: jobId },
        query: {
          limit: LOG_PAGE_LIMIT,
          next_token: pageParam ?? undefined,
          start_from_head: true,
        },
        signal,
        throwOnError: true,
      })
      return logData
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more && lastPage.next_token
        ? lastPage.next_token
        : undefined,
  })

  // ── Scroll state ─────────────────────────────────────────────────────

  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // True when the user is within FETCH_THRESHOLD_PX of the bottom.
  // In live mode, starts true so auto-scroll kicks in immediately.
  const isAtBottomRef = useRef(isLive)

  // Drives the "Scroll to load more" overlay visibility (browse mode).
  const [isNearBottom, setIsNearBottom] = useState(false)

  // Reset when new content loads — viewport is no longer near the bottom.
  useEffect(() => {
    setIsNearBottom(false)
  }, [data])

  // ── Live mode: auto-walk all pages ───────────────────────────────────

  useEffect(() => {
    if (isLive && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [isLive, hasNextPage, isFetchingNextPage, fetchNextPage])

  // ── Browse mode: auto-fill until viewport is scrollable ──────────────

  useEffect(() => {
    if (isLive) return
    const viewport = getViewport()
    if (!viewport) return
    if (viewport.scrollHeight <= viewport.clientHeight && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [isLive, data, hasNextPage, isFetchingNextPage, fetchNextPage])

  // ── Scroll handler ───────────────────────────────────────────────────
  // Re-attaches when query state changes. Updates isAtBottomRef (for live
  // auto-scroll) and isNearBottom state (for browse overlay). In browse
  // mode, triggers fetchNextPage when the user scrolls near the bottom.

  useEffect(() => {
    const viewport = getViewport()
    if (!viewport) return

    let lastScrollTop = viewport.scrollTop
    const onScroll = () => {
      const distanceFromBottom =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight
      const indicatorThreshold = Math.max(
        INDICATOR_THRESHOLD_MIN_PX,
        viewport.scrollHeight * INDICATOR_THRESHOLD_RATIO,
      )
      const scrollingDown = viewport.scrollTop >= lastScrollTop
      lastScrollTop = viewport.scrollTop

      isAtBottomRef.current = distanceFromBottom < FETCH_THRESHOLD_PX
      setIsNearBottom(scrollingDown && distanceFromBottom < indicatorThreshold)

      if (
        !isLive &&
        distanceFromBottom < FETCH_THRESHOLD_PX &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage()
      }
    }

    viewport.addEventListener('scroll', onScroll, { passive: true })
    return () => viewport.removeEventListener('scroll', onScroll)
  }, [isLive, hasNextPage, isFetchingNextPage, fetchNextPage])

  // ── Live polling: append-only, never re-fetch old pages ──────────────

  useEffect(() => {
    if (!isLive) return
    if (status !== 'success') return

    const controller = new AbortController()

    const pollOnce = async () => {
      if (isFetchingNextPage) return

      const cache = queryClient.getQueryData<
        InfiniteData<LogResponse, string | undefined>
      >(queryKey)
      if (!cache || cache.pages.length === 0) return

      const lastPage = cache.pages[cache.pages.length - 1]
      const lastToken = lastPage.next_token
      if (!lastToken) return

      const { data: newPageData } = await getJobLogPaginated({
        path: { job_id: jobId },
        query: {
          limit: LOG_PAGE_LIMIT,
          next_token: lastToken,
          start_from_head: true,
        },
        signal: controller.signal,
        throwOnError: true,
      })
      if (newPageData.events.length === 0) return

      queryClient.setQueryData<
        InfiniteData<LogResponse, string | undefined>
      >(queryKey, (old) => {
        if (!old) return old
        return {
          pages: [...old.pages, newPageData],
          pageParams: [...old.pageParams, lastToken],
        }
      })
    }

    const id = setInterval(() => { void pollOnce() }, POLL_INTERVAL_MS)
    return () => {
      clearInterval(id)
      controller.abort()
    }
  }, [isLive, status, jobId, queryClient, queryKey, isFetchingNextPage])

  // ── Live auto-scroll: pin to bottom when data changes ────────────────

  useEffect(() => {
    if (!isLive || !isAtBottomRef.current) return
    const viewport = getViewport()
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight
    }
  }, [isLive, data])

  // ── Helpers ──────────────────────────────────────────────────────────

  function getViewport() {
    return scrollAreaRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    ) ?? null
  }

  // ── Public API ───────────────────────────────────────────────────────

  const lines = data?.pages.flatMap((page) => page.events) ?? []

  return {
    lines,
    error,
    status,
    hasNextPage,
    isFetchingNextPage,
    isNearBottom,
    scrollAreaRef,
  }
}

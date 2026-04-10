import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { Calendar, FileText, Server, Terminal, User } from 'lucide-react'
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'
import type { InfiniteData } from '@tanstack/react-query'
import type { LogResponse } from '@/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyableText } from '@/components/copyable-text'
import { JobStatusBadge } from '@/components/job-status-badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { getJobLogPaginated } from '@/client'
import {
  getJobLogPaginatedQueryKey,
  getJobOptions,
} from '@/client/@tanstack/react-query.gen'

const LOG_PAGE_LIMIT = 1000
const LOG_POLL_INTERVAL_MS = 5000

export const Route = createFileRoute('/_auth/jobs/$job_id/')({
  component: RouteComponent,
})

function RouteComponent() {
  const routeApi = getRouteApi('/_auth/jobs/$job_id')
  const { job: initialJob } = routeApi.useLoaderData()

  const { data: job = initialJob } = useQuery({
    ...getJobOptions({
      path: {
        job_id: initialJob.id,
      }
    }),
    initialData: initialJob,
    refetchInterval: (query) => {
      const status = query.state.data?.status ?? initialJob.status
      return ['SUCCEEDED', 'FAILED'].includes(status) ? false : 5000
    },
    refetchIntervalInBackground: true,
  })

  const shouldPollJobLog = ['RUNNING'].includes(job.status)

  const queryClient = useQueryClient()

  const jobLogQueryKey = useMemo(
    () =>
      [
        ...getJobLogPaginatedQueryKey({
          path: { job_id: job.id },
          query: { limit: LOG_PAGE_LIMIT, start_from_head: true },
        }),
        'infinite',
      ] as const,
    [job.id],
  )

  const {
    data: jobLogData,
    error: jobLogError,
    status: jobLogStatus,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<
    LogResponse,
    Error,
    InfiniteData<LogResponse, string | undefined>,
    typeof jobLogQueryKey,
    string | undefined
  >({
    queryKey: jobLogQueryKey,
    queryFn: async ({ pageParam, signal }) => {
      const { data } = await getJobLogPaginated({
        path: { job_id: job.id },
        query: {
          limit: LOG_PAGE_LIMIT,
          next_token: pageParam ?? undefined,
          start_from_head: true,
        },
        signal,
        throwOnError: true,
      })
      return data!
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more && lastPage.next_token
        ? lastPage.next_token
        : undefined,
  })

  // Auto-walk: drain hasNextPage until the initial load reaches the tail.
  // Also fires again after the polling effect appends a page whose has_more
  // is true (a backlog built up between polls).
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Mirror isFetchingNextPage into a ref so the polling effect can read the
  // latest value without tearing down its interval every time the flag toggles
  // during the initial walk.
  const isFetchingNextPageRef = useRef(isFetchingNextPage)
  useEffect(() => {
    isFetchingNextPageRef.current = isFetchingNextPage
  }, [isFetchingNextPage])

  // Append-only polling: while the job is running, every 5s fetch a single
  // page starting from the last cached page's next_token and append it to
  // the infinite query data. Previously loaded pages are never re-fetched.
  useEffect(() => {
    if (!shouldPollJobLog) return
    if (jobLogStatus !== 'success') return

    const controller = new AbortController()

    const pollOnce = async () => {
      // Don't interleave with the auto-walk effect.
      if (isFetchingNextPageRef.current) return

      const cache = queryClient.getQueryData<
        InfiniteData<LogResponse, string | undefined>
      >(jobLogQueryKey)
      if (!cache || cache.pages.length === 0) return

      const lastPage = cache.pages[cache.pages.length - 1]
      const lastToken = lastPage.next_token
      if (!lastToken) return

      const { data } = await getJobLogPaginated({
        path: { job_id: job.id },
        query: {
          limit: LOG_PAGE_LIMIT,
          next_token: lastToken,
          start_from_head: true,
        },
        signal: controller.signal,
        throwOnError: true,
      })
      if (!data || data.events.length === 0) return

      queryClient.setQueryData<
        InfiniteData<LogResponse, string | undefined>
      >(jobLogQueryKey, (old) => {
        if (!old) return old
        return {
          pages: [...old.pages, data],
          pageParams: [...old.pageParams, lastToken],
        }
      })
    }

    const id = setInterval(() => {
      void pollOnce()
    }, LOG_POLL_INTERVAL_MS)
    return () => {
      clearInterval(id)
      controller.abort()
    }
  }, [
    shouldPollJobLog,
    jobLogStatus,
    job.id,
    queryClient,
    jobLogQueryKey,
  ])

  // Auto-scroll: pin the log to the bottom while the user hasn't scrolled up.
  // We track whether the viewport is "near the bottom" and only scroll when it is.
  const logEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )
    if (!viewport) return

    const onScroll = () => {
      const threshold = 50
      isNearBottomRef.current =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <
        threshold
    }

    viewport.addEventListener('scroll', onScroll, { passive: true })
    return () => viewport.removeEventListener('scroll', onScroll)
  }, [])

  const isAutoWalking = hasNextPage || isFetchingNextPage
  useEffect(() => {
    if (isNearBottomRef.current) {
      // Use instant scroll during rapid page loading so the smooth-scroll
      // animation doesn't fall behind and accidentally un-pin the viewport.
      logEndRef.current?.scrollIntoView({
        behavior: isAutoWalking ? 'instant' : 'smooth',
      })
    }
  })

  const jobLogLines =
    jobLogData?.pages.flatMap((page) => page.events) ?? []
  const jobLogText = jobLogLines
    .map((line, index) => `${index + 1}: ${line}`)
    .join('\n')
  const jobLogErrorMessage = jobLogError instanceof Error
    ? jobLogError.message
    : 'Unable to load job log.'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-extralight break-words">{job.name}</h1>
        <div className="flex items-center gap-4 flex-shrink-0">
          <span className="inline-flex items-center text-sm text-muted-foreground">
            <span className={`w-2 h-2 rounded-full mr-2 ${job.viewed ? 'bg-gray-400' : 'bg-blue-500'}`}></span>
            {job.viewed ? 'Viewed' : 'Unviewed'}
          </span>
          <JobStatusBadge status={job.status} />
        </div>
      </div>

      {/* Job Details */}
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Server className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Job ID</p>
                  <CopyableText text={job.id} className="text-sm text-muted-foreground font-mono" />
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-4">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Submitted By</p>
                  <p className="text-sm text-muted-foreground">{job.user}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-4">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Submitted On</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(job.submitted_on).toLocaleString()}
                  </p>
                </div>
              </div>

              <Separator className="md:hidden" />
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Log Stream Name</p>
                  {job.log_stream_name ? (
                    <CopyableText text={job.log_stream_name} className="text-sm text-muted-foreground font-mono break-all" />
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Not available</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-4">
                <Terminal className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Command</p>
                  <code className="block text-sm text-muted-foreground bg-muted p-2 rounded break-all">
                    {job.command}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Log - Full Width */}
      <Card className="border-0 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Job Log</CardTitle>
          {shouldPollJobLog ? (
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Live updating
            </span>
          ) : null}
        </CardHeader>
        <CardContent>
          <ScrollArea ref={scrollAreaRef} className="h-[500px] rounded-lg border border-border bg-muted">
            {jobLogStatus === 'pending' ? (
              <div className="p-4 text-sm text-muted-foreground">Loading job log...</div>
            ) : jobLogError ? (
              <div className="p-4 text-sm text-destructive">Failed to load job log: {jobLogErrorMessage}</div>
            ) : (
              <div className="p-4 font-mono text-sm text-muted-foreground whitespace-pre">
                {jobLogText.length > 0
                  ? jobLogText
                  : 'No job log output is available yet.'}
                {isFetchingNextPage && jobLogLines.length > 0 ? (
                  <div className="pt-2 text-xs text-muted-foreground italic">Loading more...</div>
                ) : null}
                <div ref={logEndRef} />
              </div>
            )}
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

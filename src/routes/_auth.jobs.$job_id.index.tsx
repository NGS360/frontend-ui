import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { Calendar, ChevronDown, FileText, Server, Terminal, User } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyableText } from '@/components/copyable-text'
import { JobStatusBadge } from '@/components/job-status-badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { getJobOptions } from '@/client/@tanstack/react-query.gen'
import { useJobLog } from '@/hooks/use-job-log'

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

  const isLive = job.status === 'RUNNING'

  const {
    lines,
    error: jobLogError,
    status: jobLogStatus,
    hasNextPage,
    isFetchingNextPage,
    isNearBottom,
    scrollAreaRef,
  } = useJobLog(job.id, isLive)

  const jobLogText = lines
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
          {isLive ? (
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Live updating
            </span>
          ) : null}
        </CardHeader>
        <CardContent>
          <div className="relative">
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
                </div>
              )}
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
            {!isLive && hasNextPage && (isNearBottom || isFetchingNextPage) ? (
              <>
                <div className="absolute inset-0 pointer-events-none rounded-lg bg-gradient-to-b from-transparent from-90% to-white" />
                <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground shadow-sm">
                    {isFetchingNextPage ? (
                      <>Loading more...</>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" />
                        Scroll to load more
                      </>
                    )}
                  </span>
                </div>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

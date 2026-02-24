import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { Calendar, Cloud, FileText, Server, Terminal, User } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyableText } from '@/components/copyable-text'
import { JobStatusBadge } from '@/components/job-status-badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { getJobLogOptions, getJobOptions } from '@/client/@tanstack/react-query.gen'

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
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  })

  const shouldPollJobLog = ['RUNNING'].includes(job.status)

  const { data: jobLog, isLoading: isJobLogLoading, error: jobLogError } = useQuery({
    ...getJobLogOptions({
      path: {
        job_id: job.id,
      }
    }),
    refetchInterval: shouldPollJobLog ? 5000 : false,
    refetchIntervalInBackground: true,
  })

  const jobLogText = jobLog
    ?.map((line, index) => `${index + 1}: ${line}`)
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

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column - Job Details */}
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <Server className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Job ID</p>
                <CopyableText text={job.id} className="text-sm text-muted-foreground" />
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
          </CardContent>
        </Card>

        {/* Right Column - AWS Batch Info */}
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle>AWS Batch Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <Cloud className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">AWS Job ID</p>
                {job.aws_job_id ? (
                  <CopyableText text={job.aws_job_id} className="text-sm text-muted-foreground font-mono" />
                ) : (
                  <p className="text-sm text-muted-foreground italic">Not available</p>
                )}
              </div>
            </div>

            <Separator />

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
          </CardContent>
        </Card>
      </div>

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
          <ScrollArea className="h-[500px] rounded-lg border border-border bg-muted">
            {isJobLogLoading ? (
              <div className="p-4 text-sm text-muted-foreground">Loading job log...</div>
            ) : jobLogError ? (
              <div className="p-4 text-sm text-destructive">Failed to load job log: {jobLogErrorMessage}</div>
            ) : (
              <div className="p-4 font-mono text-sm text-muted-foreground whitespace-pre">
                {jobLogText && jobLogText.length > 0
                  ? jobLogText
                  : 'No job log output is available yet.'}
              </div>
            )}
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

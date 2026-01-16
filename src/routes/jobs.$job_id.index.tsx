import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { Calendar, Cloud, FileText, Server, Terminal, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyableText } from '@/components/copyable-text'
import { JobStatusBadge } from '@/components/job-status-badge'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/jobs/$job_id/')({
  component: RouteComponent,
})

function RouteComponent() {
  const routeApi = getRouteApi('/jobs/$job_id')
  const { job } = routeApi.useLoaderData()

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
        <CardHeader>
          <CardTitle>Job Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-muted p-4 font-mono text-sm overflow-auto max-h-[600px] text-muted-foreground whitespace-pre-wrap">
{`[2026-01-15 20:13:41] Starting job execution...
[2026-01-15 20:13:42] Loading configuration from /config/job.yaml
[2026-01-15 20:13:42] Initializing AWS Batch environment
[2026-01-15 20:13:43] Connecting to data source
[2026-01-15 20:13:44] Processing data files...
[2026-01-15 20:13:45] Running basecalling algorithm
[2026-01-15 20:13:50] Progress: 10% complete
[2026-01-15 20:14:00] Progress: 25% complete
[2026-01-15 20:14:15] Progress: 50% complete
[2026-01-15 20:14:30] Progress: 75% complete
[2026-01-15 20:14:45] Progress: 90% complete
[2026-01-15 20:15:00] ✓ Job completed successfully
[2026-01-15 20:15:01] Writing output files...
[2026-01-15 20:15:02] Cleaning up temporary files
[2026-01-15 20:15:03] ✓ Job finished`}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

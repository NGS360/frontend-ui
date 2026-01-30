import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { Calendar, Cloud, FileText, Server, Terminal, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyableText } from '@/components/copyable-text'
import { JobStatusBadge } from '@/components/job-status-badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

export const Route = createFileRoute('/_authenticated/jobs/$job_id/')({
  component: RouteComponent,
})

function RouteComponent() {
  const routeApi = getRouteApi('/_authenticated/jobs/$job_id')
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
          <ScrollArea className="h-[500px] rounded-lg border border-border bg-muted">
            <div className="p-4 font-mono text-sm text-muted-foreground whitespace-pre">
{`[2026-01-15 20:13:41] Starting job execution...
[2026-01-15 20:13:42] Loading configuration from /config/job.yaml
[2026-01-15 20:13:42] Initializing AWS Batch environment
[2026-01-15 20:13:43] Connecting to data source at s3://bms-ngs360-data/input/190110_MACHINE123_0001_FLOWCELL123/
[2026-01-15 20:13:44] Processing data files...
[2026-01-15 20:13:45] Running basecalling algorithm with parameters: --min-qscore=7 --detect-mid-strand-adapter
[2026-01-15 20:13:46] Allocated 32GB memory for processing
[2026-01-15 20:13:47] GPU acceleration enabled (NVIDIA Tesla T4)
[2026-01-15 20:13:48] Loading fast5 files from input directory
[2026-01-15 20:13:49] Found 2,456 fast5 files to process
[2026-01-15 20:13:50] Progress: 10% complete (245/2456 files processed)
[2026-01-15 20:13:55] Processing batch 1/10
[2026-01-15 20:14:00] Progress: 25% complete (614/2456 files processed)
[2026-01-15 20:14:05] Basecalling throughput: 125 samples/second
[2026-01-15 20:14:10] Memory usage: 18.5GB / 32GB
[2026-01-15 20:14:15] Progress: 50% complete (1228/2456 files processed)
[2026-01-15 20:14:20] Processing batch 5/10
[2026-01-15 20:14:25] Quality metrics: Mean Q-score: 12.4
[2026-01-15 20:14:30] Progress: 75% complete (1842/2456 files processed)
[2026-01-15 20:14:35] Processing batch 8/10
[2026-01-15 20:14:40] Adapter detection: 98.2% success rate
[2026-01-15 20:14:45] Progress: 90% complete (2210/2456 files processed)
[2026-01-15 20:14:50] Processing final batch 10/10
[2026-01-15 20:14:55] Finalizing basecalling results
[2026-01-15 20:15:00] ✓ Job completed successfully
[2026-01-15 20:15:01] Writing output files to s3://bms-ngs360-data/output/190110_MACHINE123_0001_FLOWCELL123/
[2026-01-15 20:15:02] Generated 2,456 FASTQ files
[2026-01-15 20:15:03] Total bases called: 12.5 Gb
[2026-01-15 20:15:04] Average read length: 5,100 bp
[2026-01-15 20:15:05] N50 read length: 7,850 bp
[2026-01-15 20:15:06] Creating summary report
[2026-01-15 20:15:07] Generating quality control plots
[2026-01-15 20:15:08] Compressing output files
[2026-01-15 20:15:09] Uploading results to S3
[2026-01-15 20:15:10] Upload progress: 25%
[2026-01-15 20:15:15] Upload progress: 50%
[2026-01-15 20:15:20] Upload progress: 75%
[2026-01-15 20:15:25] Upload progress: 100%
[2026-01-15 20:15:26] Verifying uploaded files
[2026-01-15 20:15:27] Cleaning up temporary files from /tmp/basecalling-workspace/
[2026-01-15 20:15:28] Removed 45.2 GB of temporary data
[2026-01-15 20:15:29] Updating job metadata in database
[2026-01-15 20:15:30] Sending completion notification
[2026-01-15 20:15:31] ✓ Job finished
[2026-01-15 20:15:32] Total execution time: 111 seconds
[2026-01-15 20:15:33] Average processing rate: 22 files/second
[2026-01-15 20:15:34] Peak memory usage: 24.8 GB
[2026-01-15 20:15:35] GPU utilization: 87% average
[2026-01-15 20:15:36] Exit code: 0`}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

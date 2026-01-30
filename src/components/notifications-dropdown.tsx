import { Inbox } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { getJobsOptions } from '@/client/@tanstack/react-query.gen'
import { DEFAULT_JOBS_QUERY_OPTIONS, useViewJob } from '@/hooks/use-job-queries'
import { useAuth } from '@/context/auth-context'

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false)
  const { viewJob } = useViewJob()
  const { user } = useAuth() 

  const { data: jobsData, isLoading } = useQuery({
    ...getJobsOptions({
      query: {
        ...DEFAULT_JOBS_QUERY_OPTIONS.query,
        limit: 10,
        user: user?.email || 'system',
      }
    })
  })

  const jobs = jobsData?.data || []
  const hasUnviewedJobs = jobs.some((job) => !job.viewed)

  const handleJobClick = async (jobId: string) => {
    // Mark job as viewed and navigate
    await viewJob(jobId)

    // Close the popover
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Inbox className="h-5 w-5" />
          {hasUnviewedJobs && (
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary" />
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Recent Jobs</h3>
        </div>
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Loading jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No jobs found for user: {user?.email || 'system'}
            </div>
          ) : (
            <div className="divide-y">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleJobClick(job.id)}
                >
                  <div className="flex items-start gap-2">
                    {/* Viewed/Unviewed indicator */}
                    <div className="mt-1.5 flex-shrink-0">
                      {!job.viewed ? (
                        <div className="h-2 w-2 rounded-full bg-primary" title="Unread" />
                      ) : (
                        <div className="h-2 w-2 rounded-full border border-muted-foreground/30" title="Read" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="font-medium text-sm whitespace-nowrap">{job.name}</div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        Status: <span className="capitalize">{job.status}</span>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(job.submitted_on).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <Separator />
        <div className="p-2">
          <Link to="/profile" hash="jobs" className="block">
            <Button variant="ghost" className="w-full justify-center text-sm">
              View All Jobs
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}

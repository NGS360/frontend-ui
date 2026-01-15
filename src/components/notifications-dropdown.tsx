import { Bell } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { getJobsOptions } from '@/client/@tanstack/react-query.gen'

export function NotificationsDropdown() {
  // Hard-code the user as "system" until auth is done
  const { data: jobsData, isLoading } = useQuery(
    getJobsOptions({
      query: {
        user: 'system',
        limit: 10,
        sort_by: 'submitted_on',
        sort_order: 'desc',
      },
    })
  )

  const jobs = jobsData?.data || []
  const jobCount = jobs.length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {jobCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {jobCount > 9 ? '9+' : jobCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Job Notifications</h3>
        </div>
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Loading jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No jobs found for user: system
            </div>
          ) : (
            <div className="divide-y">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-2">
                    {/* Viewed/Unviewed indicator */}
                    <div className="mt-1.5 flex-shrink-0">
                      {!job.viewed ? (
                        <div className="h-2 w-2 rounded-full bg-blue-500" title="Unread" />
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
          <Link to="/admin/jobs" className="block">
            <Button variant="ghost" className="w-full justify-center text-sm">
              View All Jobs
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table'
import type { BatchJobPublic } from '@/client'
import { getJobsOptions, getJobsQueryKey } from '@/client/@tanstack/react-query.gen'
import { useViewJob } from '@/hooks/use-job-queries'
import { ServerDataTable } from '@/components/data-table/data-table'
import { SortableHeader } from '@/components/data-table/sortable-header'
import { CopyableText } from '@/components/copyable-text'
import { JobStatusBadge } from '@/components/job-status-badge'
import { FullscreenSpinner } from '@/components/spinner'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_auth/jobs/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: user } = useCurrentUser()
  const { viewJob } = useViewJob()
  const queryClient = useQueryClient()

  const username = user?.username || 'system'

  // Table state for jobs
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  })

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'submitted_on', desc: true }
  ])

  // Query key for jobs list
  const jobsQueryKey = getJobsQueryKey({
    query: {
      skip: pagination.pageIndex * pagination.pageSize,
      limit: pagination.pageSize,
      sort_by: sorting[0]?.id as 'id' | 'name' | 'user' | 'status' | 'submitted_on',
      sort_order: sorting[0]?.desc ? 'desc' : 'asc',
      user: username,
    },
  })

  // Query user-specific jobs
  const { data: jobsData, error, isFetching } = useQuery({
    ...getJobsOptions({
      query: {
        skip: pagination.pageIndex * pagination.pageSize,
        limit: pagination.pageSize,
        sort_by: sorting[0]?.id as 'id' | 'name' | 'user' | 'status' | 'submitted_on',
        sort_order: sorting[0]?.desc ? 'desc' : 'asc',
        user: username,
      },
    }),
    placeholderData: keepPreviousData
  })

  // Handle job row click
  const handleJobClick = (jobId: string) => {
    viewJob(jobId, [jobsQueryKey])
  }

  const handleRefreshJobs = () => {
    queryClient.invalidateQueries({ queryKey: jobsQueryKey, refetchType: 'all' })
  }

  // Define job columns
  const jobColumns: Array<ColumnDef<BatchJobPublic>> = [
    {
      id: 'viewed',
      header: '',
      cell: ({ row }) => {
        const job = row.original
        return (
          <div className="flex items-center justify-center w-4">
            {!job.viewed ? (
              <div className="h-2 w-2 rounded-full bg-primary" title="Unread" />
            ) : (
              <div className="h-2 w-2 rounded-full border border-muted-foreground/30" title="Read" />
            )}
          </div>
        )
      },
      enableSorting: false,
      size: 40,
    },
    {
      accessorKey: 'id',
      meta: { alias: 'Job ID' },
      header: ({ column }) => <SortableHeader column={column} name="Job ID" />,
      cell: ({ cell }) => {
        const id = cell.getValue() as string
        return <CopyableText text={id} variant='primary' />
      }
    },
    {
      accessorKey: 'name',
      meta: { alias: 'Job Name' },
      header: ({ column }) => <SortableHeader column={column} name="Job Name" />,
      cell: ({ cell }) => {
        const name = cell.getValue() as string
        return <span className='text-sm'>{name}</span>
      }
    },
    {
      accessorKey: 'status',
      meta: { alias: 'Status' },
      header: ({ column }) => <SortableHeader column={column} name="Status" />,
      cell: ({ cell }) => {
        const status = cell.getValue() as BatchJobPublic['status']
        return <JobStatusBadge status={status} />
      }
    },
    {
      accessorKey: 'submitted_on',
      meta: { alias: 'Submitted' },
      header: ({ column }) => <SortableHeader column={column} name="Submitted" />,
      cell: ({ cell }) => {
        const submitted = cell.getValue() as string
        const date = new Date(submitted.replace(' ', 'T') + 'Z')
        return <span className='text-sm text-muted-foreground'>{date.toLocaleString(undefined, { timeZoneName: 'short' })}</span>
      }
    },
  ]

  if (error) return 'An error has occurred: ' + error.message
  if (!jobsData) return <FullscreenSpinner variant='ellipsis' />

  const totalPages = Math.ceil(jobsData.count / pagination.pageSize)

  // Define table tools
  const toolbar = (
    <>
      <Button
        type="button"
        variant="outline"
        size="default"
        onClick={handleRefreshJobs}
        disabled={isFetching}
      >
        <RefreshCw className={`${isFetching ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </>
  )

  return (
    <div className='flex flex-col gap-6 ml-8 mr-8 mt-8 pb-8'>
      <div className='flex flex-col gap-2'>
        <h1 className="text-3xl">Jobs</h1>
        <p className="text-muted-foreground">
          View and manage your submitted jobs.
        </p>
      </div>

      <ServerDataTable
        data={jobsData.data}
        columns={jobColumns}
        pagination={pagination}
        onPaginationChange={setPagination}
        pageCount={totalPages}
        totalItems={jobsData.count}
        sorting={sorting}
        onSortingChange={setSorting}
        columnVisibility={{ id: false }}
        tableTools={toolbar}
        rowClickCallback={(row) => handleJobClick(row.original.id)}
        notFoundComponent={
          <div className="text-center py-8 text-muted-foreground">
            No jobs found for user: {username}
          </div>
        }
      />
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table'
import type { BatchJobPublic } from '@/client'
import { getJobsOptions, getJobsQueryKey } from '@/client/@tanstack/react-query.gen'
import { useViewJob } from '@/hooks/use-job-queries'
import { ServerDataTable } from '@/components/data-table/data-table'
import { SortableHeader } from '@/components/data-table/sortable-header'
import { CopyableText } from '@/components/copyable-text'
import { JobStatusBadge } from '@/components/job-status-badge'
import { ErrorState } from '@/components/error-state'
import { ErrorBanner } from '@/components/error-banner'
import { Button } from '@/components/ui/button'

/** Sortable columns the jobs endpoint accepts. */
type JobSortField = 'id' | 'name' | 'user' | 'status' | 'submitted_on'

type ProjectJobsTableProps = {
  /** Project business key, e.g. P-19900109-0001 */
  projectId: string
  /** Reports the server-side total so the caller can label the section */
  onCountChange?: (count: number) => void
}

/**
 * AWS Batch jobs submitted under a project.
 *
 * Paginated and sorted server-side: an active project accumulates hundreds of
 * jobs, so the whole set is never fetched at once.
 *
 * Only jobs carrying a project_id appear here. Flowcell-level work such as
 * demultiplexing spans many projects and is deliberately unattributed; those
 * jobs remain visible on /jobs and /admin/jobs.
 */
export function ProjectJobsTable({ projectId, onCountChange }: ProjectJobsTableProps) {
  const { viewJob } = useViewJob()
  const queryClient = useQueryClient()

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'submitted_on', desc: true },
  ])

  const jobsQuery = {
    project_id: projectId,
    skip: pagination.pageIndex * pagination.pageSize,
    limit: pagination.pageSize,
    sort_by: (sorting[0]?.id ?? 'submitted_on') as JobSortField,
    sort_order: sorting[0]?.desc ? ('desc' as const) : ('asc' as const),
  }

  const jobsQueryKey = getJobsQueryKey({ query: jobsQuery })

  const { data: jobsData, error, isFetching, refetch } = useQuery({
    ...getJobsOptions({ query: jobsQuery }),
    // Keep the previous page on screen while the next one loads, so paging
    // through does not collapse the accordion's height on every click.
    placeholderData: keepPreviousData,
  })

  // Reported via an effect rather than during render: calling back into the
  // parent's setState mid-render would warn about updating another component.
  // The callback is held in a ref so an inline arrow from the caller cannot
  // re-trigger the effect and loop through the parent's re-render.
  const onCountChangeRef = useRef(onCountChange)
  onCountChangeRef.current = onCountChange

  const jobCount = jobsData?.count
  useEffect(() => {
    if (jobCount !== undefined) onCountChangeRef.current?.(jobCount)
  }, [jobCount])

  const columns: Array<ColumnDef<BatchJobPublic>> = [
    {
      id: 'viewed',
      header: '',
      cell: ({ row }) => (
        <div className='flex items-center justify-center w-4'>
          {!row.original.viewed ? (
            <div className='h-2 w-2 rounded-full bg-primary' title='Unread' />
          ) : (
            <div className='h-2 w-2 rounded-full border border-muted-foreground/30' title='Read' />
          )}
        </div>
      ),
      enableSorting: false,
      size: 40,
    },
    {
      accessorKey: 'id',
      meta: { alias: 'Job ID' },
      header: ({ column }) => <SortableHeader column={column} name='Job ID' />,
      cell: ({ cell }) => <CopyableText text={cell.getValue() as string} variant='primary' />,
    },
    {
      accessorKey: 'name',
      meta: { alias: 'Job Name' },
      header: ({ column }) => <SortableHeader column={column} name='Job Name' />,
      cell: ({ cell }) => <span className='text-sm'>{cell.getValue() as string}</span>,
    },
    {
      accessorKey: 'status',
      meta: { alias: 'Status' },
      header: ({ column }) => <SortableHeader column={column} name='Status' />,
      cell: ({ cell }) => <JobStatusBadge status={cell.getValue() as BatchJobPublic['status']} />,
    },
    {
      accessorKey: 'user',
      meta: { alias: 'Submitted By' },
      header: ({ column }) => <SortableHeader column={column} name='Submitted By' />,
      cell: ({ cell }) => <span className='text-sm'>{cell.getValue() as string}</span>,
    },
    {
      accessorKey: 'submitted_on',
      meta: { alias: 'Submitted' },
      header: ({ column }) => <SortableHeader column={column} name='Submitted' />,
      cell: ({ cell }) => {
        // The API emits a naive UTC timestamp; make that explicit before
        // handing it to Date, otherwise it is parsed as local time.
        const submitted = cell.getValue() as string
        const date = new Date(submitted.replace(' ', 'T') + 'Z')
        return (
          <span className='text-sm text-muted-foreground'>
            {date.toLocaleString(undefined, { timeZoneName: 'short' })}
          </span>
        )
      },
    },
  ]

  if (error && !jobsData) {
    return <ErrorState error={error} onRetry={() => { void refetch() }} />
  }

  const toolbar = (
    <Button
      type='button'
      variant='outline'
      size='default'
      onClick={() => {
        queryClient.invalidateQueries({ queryKey: jobsQueryKey, refetchType: 'all' })
      }}
      disabled={isFetching}
    >
      <RefreshCw className={isFetching ? 'animate-spin' : ''} />
      Refresh
    </Button>
  )

  return (
    <div className='flex flex-col gap-4'>
      {error && <ErrorBanner error={error} onRetry={() => { void refetch() }} />}

      <ServerDataTable
        data={jobsData?.data ?? []}
        columns={columns}
        pagination={pagination}
        onPaginationChange={setPagination}
        pageCount={jobsData ? Math.ceil(jobsData.count / pagination.pageSize) : 0}
        totalItems={jobsData?.count ?? 0}
        sorting={sorting}
        onSortingChange={setSorting}
        columnVisibility={{ id: false }}
        isLoading={!jobsData && isFetching}
        tableTools={toolbar}
        rowClickCallback={(row) => { viewJob(row.original.id, [jobsQueryKey]) }}
        notFoundComponent={
          <div className='text-center py-8 text-muted-foreground'>
            No jobs have been submitted for this project.
          </div>
        }
      />
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import type { ColumnDef, OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table'
import type { ReactNode } from 'react'
import type { BatchJobPublic, JobStatus } from '@/client'
import { getJobsOptions, getJobsQueryKey } from '@/client/@tanstack/react-query.gen'
import { useViewJob } from '@/hooks/use-job-queries'
import { useDebounce } from '@/hooks/use-debounce'
import { projectJobCountQueryKey } from '@/hooks/use-project-counts'
import { ServerDataTable } from '@/components/data-table/data-table'
import { SortableHeader } from '@/components/data-table/sortable-header'
import { CopyableText } from '@/components/copyable-text'
import { JobStatusBadge } from '@/components/job-status-badge'
import { ErrorState } from '@/components/error-state'
import { ErrorBanner } from '@/components/error-banner'
import { FullscreenSpinner } from '@/components/spinner'
import { Button } from '@/components/ui/button'

/** Sortable columns the jobs endpoint accepts. */
export type JobSortField = 'id' | 'name' | 'user' | 'status' | 'submitted_on'

/** Matches the projects and runs list pages. */
const SEARCH_DEBOUNCE_MS = 300

export type JobsTableProps = {
  /* ---- server-side filters, passed straight through to GET /jobs ---- */

  /** Project business key, e.g. P-19900109-0001 */
  projectId?: string
  /** Sequencing run business key, e.g. 260506_VH01208_93_222FCGLNX */
  runId?: string
  /** Restrict to one submitter. */
  user?: string | null
  statusFilter?: JobStatus | null

  /* ---- search ---- */

  /**
   * Seeds the search box, for hosts that keep the term in the URL. The box
   * is always rendered; the component owns the input and debounces it before
   * querying, so every caller gets the same behaviour for free.
   */
  initialSearch?: string
  /**
   * Called with the debounced term, not every keystroke, so a host can push
   * it into the URL without flooding history.
   */
  onSearchCommit?: (search: string) => void

  /* ---- table state: internal unless the host persists it ---- */

  pagination?: PaginationState
  onPaginationChange?: OnChangeFn<PaginationState>
  sorting?: SortingState
  onSortingChange?: OnChangeFn<SortingState>

  /* ---- presentation ---- */

  /** Label for the submitter column, or false to drop it. */
  userColumn?: string | false
  columnVisibility?: Record<string, boolean>
  /** Standalone pages block on first load; embedded tabs render in place. */
  fullscreenLoading?: boolean
  notFoundComponent?: ReactNode
  /** Rendered in the toolbar ahead of Refresh. */
  toolbarExtra?: ReactNode
  /** Defaults to marking the job viewed and navigating to it. */
  onRowClick?: (jobId: string, queryKey: ReadonlyArray<unknown>) => void
}

/**
 * The one AWS Batch jobs table.
 *
 * Every view of jobs in the app -- a project's, a run's, the signed-in user's
 * and the admin list -- is the same table over the same endpoint differing
 * only by which filter is pinned and which columns show. They were four
 * near-identical copies; this is the single one, so a change like adding
 * search lands once.
 *
 * Paginated and sorted server-side: an active project accumulates hundreds of
 * jobs, so the whole set is never fetched at once.
 */
export function JobsTable({
  projectId,
  runId,
  user,
  statusFilter,
  initialSearch = '',
  onSearchCommit,
  pagination: controlledPagination,
  onPaginationChange: controlledOnPaginationChange,
  sorting: controlledSorting,
  onSortingChange: controlledOnSortingChange,
  userColumn = 'Submitted By',
  columnVisibility = { id: false },
  fullscreenLoading = false,
  notFoundComponent,
  toolbarExtra,
  onRowClick,
}: JobsTableProps) {
  const { viewJob } = useViewJob()
  const queryClient = useQueryClient()

  const [internalPagination, setInternalPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [internalSorting, setInternalSorting] = useState<SortingState>([
    { id: 'submitted_on', desc: true },
  ])

  const pagination = controlledPagination ?? internalPagination
  const setPagination = controlledOnPaginationChange ?? setInternalPagination
  const sorting = controlledSorting ?? internalSorting
  const setSorting = controlledOnSortingChange ?? setInternalSorting

  const [search, setSearch] = useState(initialSearch)
  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS)

  // Reported through a ref so an inline arrow from the caller cannot
  // re-trigger the effect, and skipped on the first run so simply mounting
  // the table does not rewrite the host's URL.
  const onSearchCommitRef = useRef(onSearchCommit)
  onSearchCommitRef.current = onSearchCommit
  const isFirstCommit = useRef(true)
  useEffect(() => {
    if (isFirstCommit.current) {
      isFirstCommit.current = false
      return
    }
    onSearchCommitRef.current?.(debouncedSearch)
  }, [debouncedSearch])

  // A narrower result set can leave the current page out of range, so send
  // the user back to the first page whenever the term settles.
  const isFirstPageReset = useRef(true)
  useEffect(() => {
    if (isFirstPageReset.current) {
      isFirstPageReset.current = false
      return
    }
    setPagination((previous) => ({ ...previous, pageIndex: 0 }))
  }, [debouncedSearch])

  const jobsQuery = {
    ...(projectId !== undefined && { project_id: projectId }),
    ...(runId !== undefined && { sequencing_run_id: runId }),
    ...(user !== undefined && { user }),
    ...(statusFilter !== undefined && { status_filter: statusFilter }),
    // Omitted rather than sent empty, so clearing the box returns to exactly
    // the query key the unsearched table already has cached.
    ...(debouncedSearch.trim() !== '' && { search: debouncedSearch.trim() }),
    skip: pagination.pageIndex * pagination.pageSize,
    limit: pagination.pageSize,
    sort_by: (sorting[0]?.id ?? 'submitted_on') as JobSortField,
    sort_order: sorting[0]?.desc ? ('desc' as const) : ('asc' as const),
  }

  const jobsQueryKey = getJobsQueryKey({ query: jobsQuery })

  const { data: jobsData, error, isFetching, refetch } = useQuery({
    ...getJobsOptions({ query: jobsQuery }),
    // Keep the previous page on screen while the next one loads, so paging
    // through does not collapse the table's height on every click.
    placeholderData: keepPreviousData,
  })

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
    ...(userColumn === false ? [] : [{
      accessorKey: 'user',
      meta: { alias: userColumn },
      header: ({ column }) => <SortableHeader column={column} name={userColumn} />,
      cell: ({ cell }) => <span className='text-sm'>{cell.getValue() as string}</span>,
    } satisfies ColumnDef<BatchJobPublic>]),
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
  if (fullscreenLoading && !jobsData) {
    return <FullscreenSpinner variant='ellipsis' />
  }

  const toolbar = (
    <>
      {toolbarExtra}
      <Button
        type='button'
        variant='outline'
        size='default'
        onClick={() => {
          queryClient.invalidateQueries({ queryKey: jobsQueryKey, refetchType: 'all' })
          // Keeps the project page's Jobs tab label in step with the rows it counts.
          if (projectId) {
            queryClient.invalidateQueries({ queryKey: projectJobCountQueryKey(projectId) })
          }
        }}
        disabled={isFetching}
      >
        <RefreshCw className={isFetching ? 'animate-spin' : ''} />
        Refresh
      </Button>
    </>
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
        columnVisibility={columnVisibility}
        globalFilter={search}
        onFilterChange={setSearch}
        isLoading={!jobsData && isFetching}
        tableTools={toolbar}
        rowClickCallback={(row) => {
          if (onRowClick) onRowClick(row.original.id, jobsQueryKey)
          else viewJob(row.original.id, [jobsQueryKey])
        }}
        notFoundComponent={
          <div className='text-center py-8 text-muted-foreground'>
            {notFoundComponent ?? 'No jobs found.'}
          </div>
        }
      />
    </div>
  )
}

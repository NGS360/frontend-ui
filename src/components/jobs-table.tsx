import { useEffect, useRef, useState } from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { ListChecks, RefreshCw, User } from 'lucide-react'
import type { ColumnDef, OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table'
import type { ReactNode } from 'react'
import type { BatchJobPublic, JobStatus } from '@/client'
import {
  getJobSubmittersOptions,
  getJobsOptions,
  getJobsQueryKey,
} from '@/client/@tanstack/react-query.gen'
import { useViewJob } from '@/hooks/use-job-queries'
import { useDebounce } from '@/hooks/use-debounce'
import { projectJobCountQueryKey } from '@/hooks/use-project-counts'
import { ServerDataTable } from '@/components/data-table/data-table'
import { SortableHeader } from '@/components/data-table/sortable-header'
import { SelectFilter } from '@/components/data-table/select-filter'
import { ComboboxFilter } from '@/components/data-table/combobox-filter'
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

/** Submitters offered before "Load more", and per press of it. */
const SUBMITTER_PAGE_SIZE = 10
/**
 * Where paging stops. The endpoint caps a page at 100, and a list that long
 * is past the point where scrolling it beats typing a name into it.
 */
const SUBMITTER_PAGE_LIMIT = 100

/** Every JobStatus the API accepts, in lifecycle order. */
const JOB_STATUSES: Array<JobStatus> = [
  'SUBMITTED',
  'PENDING',
  'RUNNABLE',
  'STARTING',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
]

// The same badge the Status column renders, so the filter reads as the thing
// it filters on rather than a second vocabulary for it.
const STATUS_FILTER_OPTIONS = JOB_STATUSES.map((status) => {
  const badge = <JobStatusBadge status={status} size='compact' />
  return { label: badge, selectedLabel: badge, value: status }
})

export type JobsTableProps = {
  /* ---- server-side filters, passed straight through to GET /jobs ---- */

  /** Project business key, e.g. P-19900109-0001 */
  projectId?: string
  /** Sequencing run business key, e.g. 240101_VH00000_1_EXAMPLE01 */
  runId?: string
  /**
   * Pin the table to one submitter. Pinned means fixed: the toolbar drops the
   * Submitted By filter, since the answer is already the same on every row.
   */
  user?: string | null

  /* ---- toolbar filters: internal unless the host persists them ---- */

  /**
   * Status and submitter are filters the table owns and renders itself, so
   * every view of jobs offers them. They follow the same rule as pagination
   * and sorting: pass a value and its handler to keep them somewhere durable
   * like the URL, or pass neither and the table keeps them in local state.
   */
  statusFilter?: JobStatus | null
  onStatusFilterChange?: (status: JobStatus | null) => void
  /** Submitters to match, any one of them. Ignored when `user` pins one. */
  userFilters?: Array<string>
  onUserFilterChange?: (users: Array<string>) => void

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

  /**
   * A host that persists these to the URL must merge onto the live params --
   * TanStack Router's `search: (previous) => ...` -- rather than spreading the
   * `search` it read this render. Changing a filter or the search term resets
   * the page, so onPaginationChange fires in the same tick as the host's own
   * filter write, and a stale snapshot written with `replace` undoes it.
   */
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
  statusFilter: controlledStatusFilter,
  onStatusFilterChange,
  userFilters: controlledUserFilters,
  onUserFilterChange,
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

  const [internalStatusFilter, setInternalStatusFilter] = useState<JobStatus | null>(
    controlledStatusFilter ?? null,
  )
  const [internalUserFilters, setInternalUserFilters] = useState<Array<string>>(
    controlledUserFilters ?? [],
  )

  const statusFilter = onStatusFilterChange ? controlledStatusFilter ?? null : internalStatusFilter
  const userFilters = onUserFilterChange ? controlledUserFilters ?? [] : internalUserFilters

  // Narrowing the set can leave the current page out of range, so both
  // filters go back to page one -- for the host's pagination too, when it
  // owns it, which keeps a persisted page number honest.
  const setStatusFilter = (status: JobStatus | null) => {
    const commit = onStatusFilterChange ?? setInternalStatusFilter
    commit(status)
    setPagination((previous) => ({ ...previous, pageIndex: 0 }))
  }
  const setUserFilters = (submittedBy: Array<string>) => {
    const commit = onUserFilterChange ?? setInternalUserFilters
    commit(submittedBy)
    setPagination((previous) => ({ ...previous, pageIndex: 0 }))
  }

  // A pinned submitter is not editable, so the filter is only offered when
  // the host leaves the submitter open.
  const isUserPinned = user != null
  // Sorted so the query key does not depend on the order they were picked in,
  // which would split the cache between identical filters.
  const submitters = isUserPinned ? [user] : [...userFilters].sort()

  // The submitters to choose from, scoped exactly as the table is, so every
  // name offered returns rows. Not fetched at all when the submitter is
  // pinned, because the filter is not rendered.
  //
  // Busiest first and a page at a time, because the set grows with the
  // platform and never shrinks -- a submitter stays one forever. A project
  // tab typically gets its whole set in the first page; the admin list pages
  // or is narrowed by typing.
  const [submitterSearch, setSubmitterSearch] = useState('')
  const debouncedSubmitterSearch = useDebounce(submitterSearch, SEARCH_DEBOUNCE_MS)
  const [submitterLimit, setSubmitterLimit] = useState(SUBMITTER_PAGE_SIZE)
  // Nothing is fetched until the filter is opened for the first time. Every
  // view of this table would otherwise spend a request on options that most
  // visits never look at, and the cache keeps later opens instant.
  const [hasOpenedSubmitters, setHasOpenedSubmitters] = useState(false)

  const submittersQuery = {
    ...(projectId !== undefined && { project_id: projectId }),
    ...(runId !== undefined && { sequencing_run_id: runId }),
    ...(debouncedSubmitterSearch.trim() !== '' && { q: debouncedSubmitterSearch.trim() }),
    limit: submitterLimit,
  }
  const { data: submittersData, isFetching: isFetchingSubmitters } = useQuery({
    ...getJobSubmittersOptions({ query: submittersQuery }),
    enabled: !isUserPinned && hasOpenedSubmitters,
    // Hold the current options while a wider page or a new term loads, so the
    // list does not blink empty under the cursor.
    placeholderData: keepPreviousData,
  })
  const submitterOptions = (submittersData?.data ?? []).map((submittedBy) => ({
    label: submittedBy.username,
    value: submittedBy.username,
    sublabel: `${submittedBy.job_count.toLocaleString()} ${
      submittedBy.job_count === 1 ? 'job' : 'jobs'
    }`,
  }))
  // `count` is every submitter matching in the scope, not the page length.
  const submittersTotal = submittersData?.count ?? 0
  const hasMoreSubmitters = submittersTotal > submitterOptions.length

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
    // Unset filters are omitted rather than sent null, so an unfiltered
    // table shares its cache entry with the plain list.
    ...(submitters.length > 0 && { user: submitters }),
    ...(statusFilter !== null && { status_filter: statusFilter }),
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
      <SelectFilter
        label='Status'
        icon={ListChecks}
        value={statusFilter}
        options={STATUS_FILTER_OPTIONS}
        onChange={(status) => setStatusFilter(status as JobStatus | null)}
      />
      {!isUserPinned && (
        <ComboboxFilter
          label='Submitted By'
          icon={User}
          values={userFilters}
          options={submitterOptions}
          onValuesChange={setUserFilters}
          placeholder='Search usernames...'
          emptyMessage={
            debouncedSubmitterSearch.trim() !== ''
              ? 'No submitter here matches that.'
              : 'No jobs have been submitted here.'
          }
          isLoading={isFetchingSubmitters}
          onOpenChange={(isOpen) => {
            if (isOpen) setHasOpenedSubmitters(true)
          }}
          searchValue={submitterSearch}
          onSearchChange={(term) => {
            setSubmitterSearch(term)
            // A new term is a new ranking, so start its paging over.
            setSubmitterLimit(SUBMITTER_PAGE_SIZE)
          }}
          hasMore={hasMoreSubmitters && submitterLimit < SUBMITTER_PAGE_LIMIT}
          onLoadMore={() =>
            setSubmitterLimit((previous) =>
              Math.min(previous + SUBMITTER_PAGE_SIZE, SUBMITTER_PAGE_LIMIT),
            )
          }
          hint={
            hasMoreSubmitters && submitterLimit >= SUBMITTER_PAGE_LIMIT
              ? `Showing the busiest ${SUBMITTER_PAGE_LIMIT} of ${submittersTotal.toLocaleString()}. Type to narrow.`
              : undefined
          }
        />
      )}
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

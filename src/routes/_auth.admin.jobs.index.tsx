import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import z from 'zod'
import { ListChecks, User } from 'lucide-react'
import type { PaginationState, SortingState } from '@tanstack/react-table'
import type { JobStatus } from '@/client'
import { JobsTable } from '@/components/jobs-table'
import { SelectFilter } from '@/components/data-table/select-filter'
import { TextFilter } from '@/components/data-table/text-filter'

// Define the search schema for jobs
const jobsSearchSchema = z.object({
  page: z.number().optional().default(1),
  per_page: z.number().optional().default(10),
  sort_by: z.union([
    z.literal('id'),
    z.literal('name'),
    z.literal('user'),
    z.literal('status'),
    z.literal('submitted_on')
  ]).optional().default('submitted_on'),
  sort_order: z.union([
    z.literal('asc'),
    z.literal('desc')
  ]).optional().default('desc'),
  status_filter: z.string().optional().nullable(),
  user_filter: z.string().optional().nullable(),
  query: z.string().optional().default(''),
})

export const Route = createFileRoute('/_auth/admin/jobs/')({
  component: RouteComponent,
  validateSearch: jobsSearchSchema,
  beforeLoad: ({ search }) => {
    search
  },
})

function RouteComponent() {
  // Manage the state of search params
  const search = Route.useSearch()
  const navigate = useNavigate()

  // Local table state
  // Pagination (0-based for Tanstack Table)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: search.page - 1,
    pageSize: search.per_page
  })

  // Sorting (default: submitted_on desc)
  const [sorting, setSorting] = useState<SortingState>([
    { id: search.sort_by, desc: search.sort_order === 'desc' ? true : false }
  ])

  // Merges onto the live params rather than spreading the `search` this
  // render read. JobsTable sends the table back to page one when the search
  // term changes, so this effect fires in the same tick as the term's own
  // write, and the router applies that write after the render that triggers
  // this. Spreading the stale snapshot -- and carrying the filters over from
  // it explicitly -- then silently undid the term that had just been set.
  useEffect(() => {
    navigate({
      to: '/admin/jobs',
      search: (previous) => ({
        ...previous,
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
        sort_by: sorting[0]?.id as 'id' | 'name' | 'user' | 'status' | 'submitted_on',
        sort_order: sorting[0]?.desc ? 'desc' : 'asc',
      }),
      replace: true
    })
  }, [pagination, sorting])

  // Handle filter changes
  const handleStatusChange = (status: string | null) => {
    navigate({
      to: '/admin/jobs',
      search: {
        ...search,
        status_filter: status,
        page: 1, // Reset to first page when filtering
      },
    })
  }

  const handleUserChange = (user: string | null) => {
    navigate({
      to: '/admin/jobs',
      search: {
        ...search,
        user_filter: user,
        page: 1, // Reset to first page when filtering
      },
    })
  }

  const filters = (
    <>
      <SelectFilter
        label="Status"
        icon={ListChecks}
        value={search.status_filter || null}
        options={[
          { label: 'Submitted', value: 'SUBMITTED' },
          { label: 'Pending', value: 'PENDING' },
          { label: 'Runnable', value: 'RUNNABLE' },
          { label: 'Starting', value: 'STARTING' },
          { label: 'Running', value: 'RUNNING' },
          { label: 'Succeeded', value: 'SUCCEEDED' },
          { label: 'Failed', value: 'FAILED' },
        ]}
        onChange={handleStatusChange}
      />
      <TextFilter
        label="User"
        icon={User}
        value={search.user_filter || null}
        onChange={handleUserChange}
        placeholder="Filter by user..."
      />
    </>
  )

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-2'>
        <div className='flex flex-col gap-2'>
          <h1 className="text-3xl">Jobs</h1>
          <p className="text-muted-foreground">
            View and manage system jobs, workflows, and processing tasks.
          </p>
        </div>
      </div>

      <JobsTable
        user={search.user_filter}
        statusFilter={search.status_filter as JobStatus | null}
        userColumn='User'
        // Admin reads the whole estate, so the job id is worth a column here.
        columnVisibility={{}}
        fullscreenLoading
        toolbarExtra={filters}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        initialSearch={search.query}
        onSearchCommit={(query) => {
          navigate({ to: '/admin/jobs', search: { ...search, query, page: 1 } })
        }}
        // Admin browses without marking anyone's job as read.
        onRowClick={(jobId) => navigate({ to: '/jobs/$job_id', params: { job_id: jobId } })}
      />
    </div>
  )
}

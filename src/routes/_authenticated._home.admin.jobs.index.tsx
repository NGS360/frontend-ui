import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import z from 'zod'
import { ListChecks, User } from 'lucide-react'
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table'
import type { BatchJobPublic, JobStatus } from '@/client'
import { getJobsOptions } from '@/client/@tanstack/react-query.gen'
import { ServerDataTable } from '@/components/data-table/data-table'
import { SortableHeader } from '@/components/data-table/sortable-header'
import { CopyableText } from '@/components/copyable-text'
import { FullscreenSpinner } from '@/components/spinner'
import { JobStatusBadge } from '@/components/job-status-badge'
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
})

export const Route = createFileRoute('/_authenticated/_home/admin/jobs/')({
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

  useEffect(() => {
    navigate({
      to: '/admin/jobs',
      search: {
        ...search,
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
        sort_by: sorting[0]?.id as 'id' | 'name' | 'user' | 'status' | 'submitted_on',
        sort_order: sorting[0]?.desc ? 'desc' : 'asc',
        status_filter: search.status_filter,
        user_filter: search.user_filter,
      },
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

  // Query jobs
  const { data, error } = useQuery({
    ...getJobsOptions({
      query: {
        skip: (search.page - 1) * search.per_page,
        limit: search.per_page,
        sort_by: search.sort_by,
        sort_order: search.sort_order,
        status_filter: search.status_filter as JobStatus | null,
        user: search.user_filter,
      },
    }),
    placeholderData: keepPreviousData
  })

  // Handle job row click - navigate without updating view status (admin only)
  const handleJobClick = (jobId: string) => {
    navigate({ to: '/jobs/$job_id', params: { job_id: jobId } })
  }

  if (error) return 'An error has occurred: ' + error.message
  if (!data) return <FullscreenSpinner variant='ellipsis' />


  // Status options for filter
  const statusOptions = [
    { label: 'Submitted', value: 'Submitted' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Runnable', value: 'Runnable' },
    { label: 'Starting', value: 'Starting' },
    { label: 'Running', value: 'Running' },
    { label: 'Succeeded', value: 'Succeeded' },
    { label: 'Failed', value: 'Failed' },
  ]
  // Calculate total pages from count and per_page
  const totalPages = Math.ceil(data.count / search.per_page)

  // Define columns
  const columns: Array<ColumnDef<BatchJobPublic>> = [
    {
      accessorKey: 'id',
      meta: { alias: 'Job ID' },
      header: ({ column }) => <SortableHeader column={column} name="Job ID" />,
      cell: ({ cell }) => {
        const id = cell.getValue() as string
        return (
          <CopyableText
            text={id}
            variant='primary'
          />
        )
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
      accessorKey: 'user',
      meta: { alias: 'User' },
      header: ({ column }) => <SortableHeader column={column} name="User" />,
      cell: ({ cell }) => {
        const user = cell.getValue() as string
        return <span className='text-sm'>{user}</span>
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
    {
      accessorKey: 'aws_job_id',
      meta: { alias: 'AWS Job ID' },
      header: 'AWS Job ID',
      cell: ({ cell }) => {
        const awsJobId = cell.getValue() as string | null
        return awsJobId ? (
          <CopyableText text={awsJobId} variant='hoverLight' />
        ) : (
          <span className='text-xs text-muted-foreground'>—</span>
        )
      }
    },
  ]

  // Define filter components
  const filterComponents = (
    <>
      <SelectFilter
        label="Status"
        icon={ListChecks}
        options={statusOptions}
        value={search.status_filter || null}
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
      <div className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
        <div className='flex flex-col gap-2'>
          <h1 className="text-3xl">Jobs</h1>
          <p className="text-muted-foreground">
            View and manage system jobs, workflows, and processing tasks.
          </p>
        </div>
      </div>
      <ServerDataTable
        data={data.data}
        columns={columns}
        pagination={pagination}
        onPaginationChange={setPagination}
        pageCount={totalPages}
        totalItems={data.count}
        sorting={sorting}
        onSortingChange={setSorting}
        filterComponents={filterComponents}
        columnVisibility={{ id: false }}
        rowClickCallback={(row) => handleJobClick(row.original.id)}
      />
    </div>
  )
}

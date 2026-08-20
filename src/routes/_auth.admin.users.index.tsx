import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import z from 'zod'
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table'
import type { UserAdminPublic } from '@/client'
import { listRolesOptions, listUsersOptions } from '@/client/@tanstack/react-query.gen'
import { ServerDataTable } from '@/components/data-table/data-table'
import { SortableHeader } from '@/components/data-table/sortable-header'
import { ErrorBanner } from '@/components/error-banner'
import { ErrorState } from '@/components/error-state'
import { RoleBadges } from '@/components/role-badges'
import { FullscreenSpinner } from '@/components/spinner'
import { UserStatusBadges } from '@/components/user-status-badges'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDebounce } from '@/hooks/use-debounce'

const SORT_FIELDS = ['username', 'email', 'full_name', 'created_at', 'last_login'] as const

// Mirrors the server's own query parameters, so the URL is the whole state of
// the page: a filtered roster is a link somebody can paste into a ticket.
const usersSearchSchema = z.object({
  skip: z.number().optional().default(0),
  limit: z.number().optional().default(20),
  q: z.string().optional(),
  role: z.string().optional(),
  // 'any' rather than an absent value, because a tri-state filter needs a name
  // for its neutral position to round-trip through the URL.
  status: z.union([z.literal('any'), z.literal('active'), z.literal('inactive')])
    .optional().default('any'),
  sort_by: z.enum(SORT_FIELDS).optional().default('username'),
  sort_order: z.union([z.literal('asc'), z.literal('desc')]).optional().default('asc'),
})

export const Route = createFileRoute('/_auth/admin/users/')({
  component: RouteComponent,
  validateSearch: usersSearchSchema,
})

function RouteComponent() {
  const search = Route.useSearch()
  const navigate = useNavigate()

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: Math.floor(search.skip / search.limit),
    pageSize: search.limit,
  })
  const [sorting, setSorting] = useState<SortingState>([
    { id: search.sort_by, desc: search.sort_order === 'desc' },
  ])

  // The table's search box is local and debounced; only the settled value goes
  // into the URL and the request, so typing a username is one query rather than
  // one per keystroke.
  const [filter, setFilter] = useState(search.q ?? '')
  const debouncedFilter = useDebounce(filter, 300)

  useEffect(() => {
    navigate({
      to: '/admin/users',
      search: {
        ...search,
        q: debouncedFilter || undefined,
        skip: pagination.pageIndex * pagination.pageSize,
        limit: pagination.pageSize,
        sort_by: sorting[0]?.id as (typeof SORT_FIELDS)[number],
        sort_order: sorting[0]?.desc ? 'desc' : 'asc',
      },
      replace: true,
    })
  }, [pagination, sorting, debouncedFilter])

  // A new filter has to reset to the first page: page 3 of a narrower result
  // set is usually empty, which reads as "no matches".
  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }, [debouncedFilter, search.role, search.status])

  const { data, error, refetch, isFetching } = useQuery({
    ...listUsersOptions({
      query: {
        skip: search.skip,
        limit: search.limit,
        q: search.q,
        role: search.role,
        is_active:
          search.status === 'any' ? undefined : search.status === 'active',
        sort_by: search.sort_by,
        sort_order: search.sort_order,
      },
    }),
    placeholderData: keepPreviousData,
  })

  // Only global roles: the filter grants nothing, but offering a project role
  // here would suggest the roster could be narrowed by one, and it cannot.
  const { data: roles } = useQuery(listRolesOptions())
  const globalRoles = (roles ?? []).filter((role) => role.scope === 'global')

  if (error && !data) return <ErrorState error={error} onRetry={() => { void refetch() }} />
  if (!data) return <FullscreenSpinner variant="ellipsis" />

  const columns: Array<ColumnDef<UserAdminPublic>> = [
    {
      accessorKey: 'username',
      meta: { alias: 'Username' },
      header: ({ column }) => <SortableHeader column={column} name="Username" />,
      cell: ({ row }) => (
        <Link
          to="/admin/users/$username"
          params={{ username: row.original.username }}
          className="text-sm font-medium text-primary hover:underline"
        >
          {row.original.username}
        </Link>
      ),
    },
    {
      accessorKey: 'full_name',
      meta: { alias: 'Name' },
      header: ({ column }) => <SortableHeader column={column} name="Name" />,
      cell: ({ cell }) => {
        const name = cell.getValue() as string | null
        return name
          ? <span className="text-sm">{name}</span>
          : <span className="text-xs text-muted-foreground">—</span>
      },
    },
    {
      accessorKey: 'email',
      meta: { alias: 'Email' },
      header: ({ column }) => <SortableHeader column={column} name="Email" />,
      cell: ({ cell }) => {
        const email = cell.getValue() as string | null
        return email
          ? <span className="text-sm text-muted-foreground">{email}</span>
          : <span className="text-xs text-muted-foreground">—</span>
      },
    },
    {
      id: 'status',
      meta: { alias: 'Status' },
      header: 'Status',
      cell: ({ row }) => (
        <UserStatusBadges
          is_active={row.original.is_active}
          is_verified={row.original.is_verified}
          is_superuser={row.original.is_superuser}
          verbose
        />
      ),
    },
    {
      id: 'global_roles',
      meta: { alias: 'Global roles' },
      header: 'Global roles',
      cell: ({ row }) => <RoleBadges roles={row.original.global_roles} linked />,
    },
    {
      accessorKey: 'last_login',
      meta: { alias: 'Last login' },
      header: ({ column }) => <SortableHeader column={column} name="Last login" />,
      cell: ({ cell }) => {
        const value = cell.getValue() as string | null
        return value ? (
          <span className="text-sm text-muted-foreground">
            {new Date(value).toLocaleString(undefined, { timeZoneName: 'short' })}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Never</span>
        )
      },
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl">Users</h1>
        <p className="text-muted-foreground">
          Every account on this deployment, including deactivated ones. Open a
          user to see and change what they can do.
        </p>
      </div>

      {error && <ErrorBanner error={error} onRetry={() => { void refetch() }} />}

      <ServerDataTable
        data={data.data}
        columns={columns}
        globalFilter={filter}
        onFilterChange={setFilter}
        pagination={pagination}
        onPaginationChange={setPagination}
        pageCount={Math.max(1, Math.ceil(data.total_items / pagination.pageSize))}
        totalItems={data.total_items}
        sorting={sorting}
        onSortingChange={setSorting}
        isLoading={isFetching}
        tableTools={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={search.role ?? 'all'}
              onValueChange={(value) =>
                navigate({
                  to: '/admin/users',
                  search: { ...search, role: value === 'all' ? undefined : value, skip: 0 },
                  replace: true,
                })
              }
            >
              <SelectTrigger id="admin-users-role-filter" className="w-[190px]">
                <SelectValue placeholder="Any role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any role</SelectItem>
                {globalRoles.map((role) => (
                  <SelectItem key={role.name} value={role.name}>
                    {role.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={search.status}
              onValueChange={(value) =>
                navigate({
                  to: '/admin/users',
                  search: { ...search, status: value as 'any' | 'active' | 'inactive', skip: 0 },
                  replace: true,
                })
              }
            >
              <SelectTrigger id="admin-users-status-filter" className="w-[170px]">
                <SelectValue placeholder="Any status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any status</SelectItem>
                <SelectItem value="active">Active only</SelectItem>
                <SelectItem value="inactive">Deactivated only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  )
}

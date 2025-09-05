import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import z from 'zod';
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table';
import type { Attribute, ProjectPublic } from '@/client';
import { searchProjectsOptions } from '@/client/@tanstack/react-query.gen'
import { ServerDataTable } from '@/components/data-table/data-table'
import { SortableHeader } from '@/components/data-table/sortable-header'
import { CopyableText } from '@/components/copyable-text'
import { useDebounce } from '@/hooks/use-debounce';

// Define the search schema for projects 
const projectsSearchSchema = z.object({
  query: z.string().optional().default(""),
  page: z.number().optional().default(1),
  per_page: z.number().optional().default(10),
  sort_by: z.union([
    z.literal('project_id'),
    z.literal('name')
  ]).optional().default('project_id'),
  sort_order: z.union([
    z.literal('asc'),
    z.literal('desc')
  ]).optional().default('desc')
})

export const Route = createFileRoute('/projects/')({
  component: RouteComponent,
  validateSearch: projectsSearchSchema,
  beforeLoad: ({ search }) => {
    search
  },
})

function RouteComponent() {

  // Manage the state of search params
  const search = Route.useSearch();
  const navigate = useNavigate();

  // Local table state
  // Global filter
  const [globalFilter, setGlobalFilter] = useState<string>(search.query);
  const debouncedInput: string = useDebounce(globalFilter, 300);

  // Pagination (0-based for Tanstack Table)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: search.page - 1,
    pageSize: search.per_page
  });

  // Sorting (default: project_id desc)
  const [sorting, setSorting] = useState<SortingState>([
    { id: search.sort_by, desc: search.sort_order == 'desc' ? true : false }
  ]);

  useEffect(() => {
    navigate({
      to: '/projects',
      search: {
        ...search,
        query: debouncedInput,
        page: 1
      }
    })
  }, [debouncedInput])

  useEffect(() => {
    navigate({
      to: '/projects',
      search: {
        ...search,
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
        sort_by: sorting[0]?.id as 'project_id' | 'name',
        sort_order: sorting[0]?.desc ? 'desc' : 'asc'
      },
      replace: true
    })
  }, [pagination, sorting])

  // Query projects
  const { data, isLoading, error } = useQuery({
    ...searchProjectsOptions({
      query: {
        query: debouncedInput,
        page: search.page,
        per_page: search.per_page,
        sort_by: search.sort_by,
        sort_order: search.sort_order
      },
    }),
    placeholderData: keepPreviousData // Makes the search feel faster
  })

  if (isLoading) return "Loading...";
  if (error) return 'An error has occurred: ' + error.message
  if (!data) return 'No data was returned.';

  // Define columns
  const columns: Array<ColumnDef<ProjectPublic>> = [
    {
      accessorKey: 'project_id',
      meta: { alias: 'Project ID' },
      header: ({ column }) => <SortableHeader column={column} name="Project ID" />,
      cell: ({ cell }) => {
        const project_id = cell.getValue() as string
        return (
          <CopyableText
            text={project_id}
            variant='hoverLink'
            asChild={true}
            children={(
              <Link
                to='/projects/$project_id'
                params={{ project_id: project_id }}
              >
                {project_id}
              </Link>
            )}
          />
        )
      }
    },
    {
      accessorKey: 'name',
      meta: { alias: 'Project Name' },
      header: ({ column }) => <SortableHeader column={column} name="Project Name" />,
      cell: ({ row }) => {
        const name: string = row.getValue('name')
        const attributes: Array<Attribute> = row.original.attributes ?? []
        return (
          <>
            <div className='flex flex-col gap-2 break-words whitespace-normal'>
              <span className='text-sm'> {/* Use line-clamp-1 here to truncate */}
                {name}
              </span>
              <div className='flex flex-wrap gap-0.5'>
                {attributes.map((a) => (
                  <div
                    key={a.key}
                    className='text-muted-foreground border-1 rounded-full px-2 text-xs'
                  >
                    <span>
                      {a.key}: {a.value && a.value.length > 50 ? a.value.slice(0, 50) + "..." : a.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )
      }
    }
  ]

  return (
    <>
      <h1 className="text-2xl">Projects</h1>
      <p className="text-muted-foreground mb-6">View all projects in NGS360</p>
      <ServerDataTable
        data={data.data}
        columns={columns}
        globalFilter={globalFilter}
        onFilterChange={setGlobalFilter}
        pagination={pagination}
        onPaginationChange={setPagination}
        pageCount={data.total_pages}
        totalItems={data.total_items}
        sorting={sorting}
        onSortingChange={setSorting}
      />
    </>
  )
}
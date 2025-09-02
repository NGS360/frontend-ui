import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import z from 'zod';
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table';
import type { SequencingRunPublic } from '@/client';
import { searchRunsOptions } from '@/client/@tanstack/react-query.gen'
import { DataTable } from '@/components/data-table/data-table'
import { SortableHeader } from '@/components/data-table/sortable-header'
import { CopyableText } from '@/components/copyable-text'
import { useDebounce } from '@/hooks/use-debounce';

// Define the search schema for projects 
const runsSearchSchema = z.object({
  query: z.string().optional().default(""),
  page: z.number().optional().default(1),
  per_page: z.number().optional().default(10),
  sort_by: z.union([
    z.literal('barcode'),
    z.literal('experiment_name')
  ]).optional().default('barcode'),
  sort_order: z.union([
    z.literal('asc'),
    z.literal('desc')
  ]).optional().default('desc')
})

export const Route = createFileRoute('/runs/')({
  component: RouteComponent,
  validateSearch: runsSearchSchema,
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

  // Sorting (default: barcode desc)
  const [sorting, setSorting] = useState<SortingState>([
    { id: search.sort_by, desc: search.sort_order == 'desc' ? true : false }
  ]);

  useEffect(() => {
    navigate({
      to: '/runs',
      search: {
        ...search,
        query: debouncedInput,
        page: 1
      }
    })

  }, [debouncedInput])

  useEffect(() => {
    navigate({
      to: '/runs',
      search: {
        ...search,
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
        sort_by: sorting[0]?.id as 'barcode' | 'experiment_name',
        sort_order: sorting[0]?.desc ? 'desc' : 'asc'
      },
      replace: true
    })
  }, [pagination, sorting])

  // Query runs
  const { data, isLoading, error } = useQuery({
    ...searchRunsOptions({
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
  const columns: Array<ColumnDef<SequencingRunPublic>> = [
    {
      accessorKey: 'barcode',
      meta: { alias: "Experiment" },
      header: ({ column }) => <SortableHeader column={column} name="Experiment" />,
      cell: ({ cell }) => {
        const barcode = cell.getValue() as string
        return (
          <CopyableText
            text={barcode}
            variant='hoverLink'
            asChild={true}
            children={(
              <Link
                to='/runs'
                params={{ barcode: barcode }}
              >
                {barcode}
              </Link>
            )}
          />
        )
      }
    },
    {
      accessorKey: 'machine_id',
      meta: { alias: "Instrument" },
      header: "Instrument"
    },
    {
      accessorKey: 'flowcell_id',
      meta: { alias: "Flowcell" },
      header: "Flowcell"
    },
    {
      accessorKey: 'run_date',
      meta: { alias: "Run Date" },
      header: "Run Date"
    },
    {
      accessorKey: 's3_run_folder_path',
      meta: { alias: "Run Folder" },
      header: "Run Folder"
    },
    {
      accessorKey: 'status',
      meta: { alias: "Status" },
      header: "Status"
    }
  ]

  return (
    <>
      <h1 className="text-2xl">Illumina Runs</h1>
      <p className="text-muted-foreground mb-6">View all illumina runs in NGS360</p>
      <DataTable
        data={data.data}
        columns={columns}
        columnVisibility={{s3_run_folder_path: false}}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        pagination={pagination}
        setPagination={setPagination}
        pageCount={data.total_pages}
        totalItems={data.total_items}
        sorting={sorting}
        setSorting={setSorting}
      />
    </>
  )
}
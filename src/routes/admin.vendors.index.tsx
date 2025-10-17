import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import z from 'zod'
import { Plus, SquarePen, Trash2 } from 'lucide-react'
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table'
import type { VendorPublic } from '@/client'
import { getVendorsOptions } from '@/client/@tanstack/react-query.gen'
import { ServerDataTable } from '@/components/data-table/data-table'
import { SortableHeader } from '@/components/data-table/sortable-header'
import { CopyableText } from '@/components/copyable-text'
import { FullscreenSpinner } from '@/components/spinner'
import { AddVendorForm } from '@/components/add-vendor-form'
import { UpdateVendorForm } from '@/components/update-vendor-form'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Define the search schema for vendors
const vendorsSearchSchema = z.object({
  page: z.number().optional().default(1),
  per_page: z.number().optional().default(10),
  sort_by: z.union([
    z.literal('vendor_id'),
    z.literal('name')
  ]).optional().default('vendor_id'),
  sort_order: z.union([
    z.literal('asc'),
    z.literal('desc')
  ]).optional().default('asc')
})

export const Route = createFileRoute('/admin/vendors/')({
  component: RouteComponent,
  validateSearch: vendorsSearchSchema,
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

  // Sorting (default: vendor_id asc)
  const [sorting, setSorting] = useState<SortingState>([
    { id: search.sort_by, desc: search.sort_order == 'desc' ? true : false }
  ])

  useEffect(() => {
    navigate({
      to: '/admin/vendors',
      search: {
        ...search,
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
        sort_by: sorting[0]?.id as 'vendor_id' | 'name',
        sort_order: sorting[0]?.desc ? 'desc' : 'asc'
      },
      replace: true
    })
  }, [pagination, sorting])

  // Query vendors
  const { data, error } = useQuery({
    ...getVendorsOptions({
      query: {
        page: search.page,
        per_page: search.per_page,
        sort_by: search.sort_by,
        sort_order: search.sort_order
      },
    }),
    placeholderData: keepPreviousData
  })

  if (error) return 'An error has occurred: ' + error.message
  if (!data) return <FullscreenSpinner variant='ellipsis' />

  // Define columns
  const columns: Array<ColumnDef<VendorPublic>> = [
    {
      accessorKey: 'vendor_id',
      meta: { alias: 'Vendor ID' },
      header: ({ column }) => <SortableHeader column={column} name="Vendor ID" />,
      cell: ({ cell }) => {
        const vendor_id = cell.getValue() as string
        return (
          <CopyableText
            text={vendor_id}
            variant='primary'
          />
        )
      }
    },
    {
      accessorKey: 'name',
      meta: { alias: 'Vendor Name' },
      header: ({ column }) => <SortableHeader column={column} name="Vendor Name" />,
      cell: ({ cell }) => {
        const name = cell.getValue() as string
        return <span className='text-sm'>{name}</span>
      }
    },
    {
      accessorKey: 'description',
      meta: { alias: 'Description' },
      header: 'Description',
      cell: ({ cell }) => {
        const description = cell.getValue() as string
        return <span className='text-sm text-muted-foreground'>{description}</span>
      }
    },
    {
      accessorKey: 'bucket',
      meta: { alias: 'Bucket' },
      header: 'Bucket',
      cell: ({ cell }) => {
        const bucket = cell.getValue() as string | null
        return bucket ? (
          <CopyableText text={bucket} variant='hoverLight' />
        ) : (
          <span className='text-xs text-muted-foreground'>—</span>
        )
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const vendor = row.original

        return (
          <div className="flex items-center">
            <Tooltip>
              <UpdateVendorForm
                vendor={vendor}
                trigger={
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                    >
                      <SquarePen />
                      <span className="sr-only">Edit</span>
                    </Button>
                  </TooltipTrigger>
                }
              />
              <TooltipContent>
                <p>Edit vendor</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    alert('Deleting vendors is not yet implemented.')
                  }}
                >
                  <Trash2 />
                  <span className="sr-only">Delete</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete vendor</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )
      }
    }
  ]

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
        <div className='flex flex-col gap-2'>
          <h1 className="text-3xl">Vendors</h1>
          <p className="text-muted-foreground">
            Manage vendor information and settings here.
          </p>
        </div>
        <AddVendorForm
          trigger={
            <Button
              variant='primary2'
              className="w-full md:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add Vendor
            </Button>
          }
        />
      </div>
      <ServerDataTable
        data={data.data}
        columns={columns}
        pagination={pagination}
        onPaginationChange={setPagination}
        pageCount={data.total_pages}
        totalItems={data.total_items}
        sorting={sorting}
        onSortingChange={setSorting}
      />
    </div>
  )
}

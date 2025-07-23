import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import type { Attribute, ProjectPublic } from '@/client'
import type { ColumnDef } from '@tanstack/react-table'
import { readProjectsOptions } from '@/client/@tanstack/react-query.gen'
import { DataTable } from '@/components/data-table/data-table'
import { SortableHeader } from '@/components/data-table/sortable-header'

export const Route = createFileRoute('/projects/')({
  component: RouteComponent,
})

function RouteComponent() {
  // Tanstack Table pagination is 0-based
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  // Query projects
  const { data, isPending, error } = useQuery({
    ...readProjectsOptions({
      query: {
        page: pagination.pageIndex + 1, // API is 1-based
        per_page: pagination.pageSize,
        sort_by: 'project_id',
        sort_order: 'asc'
      },
    }),
  })

  if (isPending) return 'Loading...'
  if (error) return 'An error has occurred: ' + error.message

  // Define columns
  const columns: Array<ColumnDef<ProjectPublic>> = [
    {
      accessorKey: 'project_id',
      header: ({ column }) => <SortableHeader column={column} name="Project ID" />,
      cell: ({ cell }) => {
        const project_id = cell.getValue() as string
        return (
          <Link
            to='/projects/$project_id'
            params={{ project_id: project_id }}
            className='text-primary hover:underline'
          >
            {project_id}
          </Link >
        )
      }
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} name="Project Name" />
    },
    {
      accessorKey: 'attributes',
      header: 'Attributes',
      size: 300,
      cell: ({ cell }) => {
        const attributes = cell.getValue() as Array<Attribute>
        return (
          <div className='flex flex-wrap gap-2'>
            {attributes.map((d) => (
              <span
                key={d.key}
                className='bg-accent rounded-full px-2 py-0.5'
              >
                {d.key}: {d.value}
              </span>
            ))}
          </div>
        )
      }
    }
  ]

  return (
    <>
      <h1 className="text-2xl">Projects</h1>
      <p className="text-muted-foreground mb-6">View all projects in NGS360</p>
      <DataTable
        columns={columns}
        data={data.data}
        pagination={pagination}
        onPaginationChange={setPagination}
        pageCount={data.total_pages}
        totalItems={data.total_items}
      />
    </>
  )
}

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Pencil, PillBottle, Plus, Tag } from 'lucide-react'
import { Link, createFileRoute, getRouteApi } from '@tanstack/react-router'
import type { Attribute, SamplePublic } from '@/client/types.gen'
import type { ColumnDef, SortingState, Updater } from '@tanstack/react-table'
import { CopyableText } from '@/components/copyable-text'
import { ServerDataTable } from '@/components/data-table/data-table'
import { SortableHeader } from '@/components/data-table/sortable-header'
import { FileUpload } from '@/components/file-upload'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { isValidHttpURL } from '@/lib/utils'
import { getSamplesOptions } from '@/client/@tanstack/react-query.gen'
import { FullscreenSpinner } from '@/components/spinner'

export const Route = createFileRoute('/projects/$project_id/overview/')({
  component: RouteComponent,
})

function RouteComponent() {
  // Load project data
  const routeApi = getRouteApi('/projects/$project_id')
  const { project } = routeApi.useLoaderData()

  // Tanstack Table pagination is 0-based
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  // Query samples
  const { data, isFetching, error } = useQuery({
    ...getSamplesOptions({
      query: {
        page: pagination.pageIndex + 1, // API is 1-based
        per_page: pagination.pageSize,
        sort_by: 'id',
        sort_order: 'desc'
      },
      path: {
        project_id: project.project_id
      }
    }),
  })

  if (isFetching) return <FullscreenSpinner variant='ellipsis' />
  if (error) return 'An error has occurred: ' + error.message

  // Define columns
  const columns: Array<ColumnDef<SamplePublic>> = [
    {
      accessorKey: 'sample_id',
      header: ({ column }) => <SortableHeader column={column} name="Sample ID" />,
      cell: ({ cell }) => {
        const sample_id = cell.getValue() as string
        return (
          <CopyableText
            text={sample_id}
            variant='hoverLink'
            asChild={true}
            children={(
              <Link
                // to='/projects/$project_id'
                to='/'
              // params={{ project_id: project_id }}
              >
                {sample_id}
              </Link>
            )}
          />
        )
      }
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} name="Sample Name" />
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

  return(
    <>
      {/* Attributes */}
      <Accordion
        type='single'
        collapsible
        className='w-full'
        defaultValue='attribute-grid'
      >
        <AccordionItem value='attribute-grid'>
          <AccordionTrigger className='uppercase font-light text-primary'>
            <span className='flex gap-2  items-center'>
              <Tag size={14} /> Project attributes
            </span>
          </AccordionTrigger>
          <AccordionContent
            className='flex flex-col gap-4'
          >
            <div className='grid grid-flow-row gap-2 md:grid-cols-3 lg:grid-cols-6'>
              <Card
                key={project.project_id}
                className='border-0 shadow-none py-2 px-0 bg-transparent'
              >
                <CardContent className='px-0'>
                  <CardTitle className='uppercase text-sm font-light text-muted-foreground'>
                    Project ID
                  </CardTitle>
                  <CardDescription className='font-semibold '>
                    <CopyableText
                      text={project.project_id || ""}
                      variant={isValidHttpURL(project.project_id) ? 'hoverLink' : 'hover'}
                      size='sm'
                      className='[&>span]:truncate'
                    />
                  </CardDescription>
                </CardContent>
              </Card>
              {project.attributes?.map((d) => (
                <Card
                  key={d.key}
                  className='border-0 shadow-none py-2 px-0 bg-transparent'
                >
                  <CardContent className='px-0'>
                    <CardTitle className='uppercase text-sm font-light text-muted-foreground'>
                      {d.key}
                    </CardTitle>
                    <CardDescription className='font-semibold '>
                      <CopyableText
                        text={d.value || ""}
                        variant={isValidHttpURL(d.value) ? 'hoverLink' : 'hover'}
                        size='sm'
                        className='[&>span]:truncate'
                      />
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button variant='outline' className='w-full md:w-fit'>
              {!project.attributes || project.attributes.length === 0 ? (
                <>
                  <Plus />
                  <span>Add attributes</span>
                </>
              ) : (
                <>
                  <Pencil />
                  <span>Edit attributes</span>
                </>
              )}
            </Button>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Samples table */}
      <Accordion
        type='single'
        collapsible
        className='w-full'
        defaultValue='samples-table'
      >
        <AccordionItem value='samples-table'>
          <AccordionTrigger className='uppercase font-light text-primary'>
            <span className='flex gap-2 items-center'>
              <PillBottle size={14} /> Sample table
            </span>
          </AccordionTrigger>
          <AccordionContent className='pt-2'>
            {data ? (
              // <DataTable<EmptyRow, any>
              <ServerDataTable
                // data={emptyData}
                // columns={emptyColumns}
                data={data.data}
                columns={columns}
                pagination={pagination}
                onPaginationChange={setPagination}
                pageCount={0}
                totalItems={0} 
                globalFilter={''} 
                onFilterChange={function (updaterOrValue: Updater<string>): void {
                  throw new Error('Function not implemented.')
                }} 
                sorting={[]} 
                onSortingChange={function (updaterOrValue: Updater<SortingState>): void {
                  throw new Error('Function not implemented.')
                }}
              />
            ) : (
              <FileUpload subject='samplesheet.tsv' />
            )}

          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  )
}

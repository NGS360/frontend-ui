import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Cog, FolderCheck, FolderSearch, HardDriveDownload, Pencil, PillBottle, Plus, Tag, Zap } from 'lucide-react'
import { Link, createFileRoute, getRouteApi } from '@tanstack/react-router'
import type { Attribute, SamplePublic } from '@/client/types.gen'
import type { ColumnDef, SortingState, Updater } from '@tanstack/react-table'
import { CopyableText } from '@/components/copyable-text'
import { ServerDataTable } from '@/components/data-table/data-table'
import { SortableHeader } from '@/components/data-table/sortable-header'
import { ExecuteWorkflowForm } from '@/components/execute-workflow-form'
import { FileBrowserDialog } from '@/components/file-browser'
import { FileUpload } from '@/components/file-upload'
import { IngestVendorDataForm } from '@/components/ingest-vendor-data-form'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { isValidHttpURL } from '@/lib/utils'
import { getSamplesOptions } from '@/client/@tanstack/react-query.gen'
import { FullscreenSpinner } from '@/components/spinner'

export const Route = createFileRoute('/projects/$project_id/')({
  component: RouteComponent,
})

function RouteComponent() {
  // Load project data
  const routeApi = getRouteApi('/projects/$project_id')
  const { project } = routeApi.useLoaderData()

  // Set data and results bucket URIs
  const DATA_BUCKET_URI = import.meta.env.VITE_DATA_BUCKET_URI || ''
  const RESULTS_BUCKET_URI = import.meta.env.VITE_RESULTS_BUCKET_URI || ''

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
      {/* Grid for attributes and new content */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
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
              <div className='grid grid-flow-row gap-2 md:grid-cols-2 lg:grid-cols-3'>
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

        {/* New accordion on the right */}
        <Accordion
          type='single'
          collapsible
          className='w-full'
          defaultValue='project-actions'
        >
          <AccordionItem value='project-actions'>
            <AccordionTrigger className='uppercase font-light text-primary'>
              <span className='flex gap-2 items-center'>
                <Zap size={14} /> Project Actions
              </span>
            </AccordionTrigger>
            <AccordionContent className='flex flex-col gap-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Data Bucket */}
                <FileBrowserDialog
                  trigger={(
                    <Card className='cursor-pointer transition-colors hover:bg-accent/50'>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                          <FolderSearch className='size-5' />
                          Data Bucket
                        </CardTitle>
                        <CardDescription>
                          Browse and manage files in the data bucket for this project
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  )}
                  rootPath={`${DATA_BUCKET_URI}/${project.project_id}/`}
                />

                {/* Results Bucket */}
                <FileBrowserDialog
                  trigger={(
                    <Card className='cursor-pointer transition-colors hover:bg-accent/50'>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                          <FolderCheck className='size-5' />
                          Results Bucket
                        </CardTitle>
                        <CardDescription>
                          View analysis results and outputs stored in the results bucket
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  )}
                  rootPath={`${RESULTS_BUCKET_URI}/${project.project_id}/`}
                />

                {/* Ingest Vendor Data */}
                <IngestVendorDataForm
                  trigger={(
                    <Card className='cursor-pointer transition-colors hover:bg-accent/50'>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                          <HardDriveDownload className='size-5' />
                          Ingest Vendor Data
                        </CardTitle>
                        <CardDescription>
                          Upload and validate vendor manifest files for data ingestion
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  )}
                  projectId={project.project_id}
                />

                {/* Execute Workflow */}
                <ExecuteWorkflowForm
                  trigger={(
                    <Card className='cursor-pointer transition-colors hover:bg-accent/50'>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                          <Cog className='size-5' />
                          Execute Workflow
                        </CardTitle>
                        <CardDescription>
                          Execute workflows and actions on this project
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

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
                onFilterChange={function (_updaterOrValue: Updater<string>): void {
                  throw new Error('Function not implemented.')
                }}
                sorting={[]}
                onSortingChange={function (_updaterOrValue: Updater<SortingState>): void {
                  throw new Error('Function not implemented.')
                }}
              />
            ) : (
                <FileUpload
                  displayComponent={(
                    <span className="text-primary hover:underline mx-2">
                      Drag and drop your samplesheet.tsv here, or click to select
                    </span>
                  )}
                />
            )}

          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  )
}
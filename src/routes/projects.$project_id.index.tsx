import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Cog, FolderCheck, FolderSearch, HardDriveDownload, Pencil, PillBottle, Plus, Tag, Zap } from 'lucide-react'
import { createFileRoute, getRouteApi, useNavigate } from '@tanstack/react-router'
import z from 'zod'
import type { SamplePublic } from '@/client/types.gen'
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table'
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
import { useColumnVisibilityStore } from '@/stores/column-visibility-store'

// Define the search schema for samples
const samplesSearchSchema = z.object({
  page: z.number().optional().default(1),
  per_page: z.number().optional().default(10),
  sort_by: z.string().optional().default('sample_id'),
  sort_order: z.union([
    z.literal('asc'),
    z.literal('desc')
  ]).optional().default('desc')
})

export const Route = createFileRoute('/projects/$project_id/')({
  component: RouteComponent,
  validateSearch: samplesSearchSchema,
  beforeLoad: ({ search }) => {
    search
  },
})

function RouteComponent() {
  // Load project data
  const routeApi = getRouteApi('/projects/$project_id')
  const { project } = routeApi.useLoaderData()

  // Set data and results bucket URIs
  const DATA_BUCKET_URI = import.meta.env.VITE_DATA_BUCKET_URI || ''
  const RESULTS_BUCKET_URI = import.meta.env.VITE_RESULTS_BUCKET_URI || ''

  // Manage the state of search params
  const search = Route.useSearch()
  const navigate = useNavigate()

  // Local table state
  // Pagination (0-based for Tanstack Table)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: search.page - 1,
    pageSize: search.per_page
  })

  // Sorting (default: sample_id desc)
  const [sorting, setSorting] = useState<SortingState>([
    { id: search.sort_by, desc: search.sort_order === 'desc' ? true : false }
  ])

  // Column visibility (persisted in Zustand store per project)
  const { getVisibility, setVisibility } = useColumnVisibilityStore()
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    getVisibility(project.project_id) || {}
  )

  // Sync column visibility to Zustand store when it changes
  useEffect(() => {
    setVisibility(project.project_id, columnVisibility)
  }, [columnVisibility, project.project_id, setVisibility])

  useEffect(() => {
    navigate({
      to: '/projects/$project_id',
      params: { project_id: project.project_id },
      search: {
        ...search,
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
        sort_by: sorting[0]?.id || 'sample_id',
        sort_order: sorting[0]?.desc ? 'desc' : 'asc'
      },
      replace: true
    })
  }, [pagination, sorting])

  // Query samples
  const { data, isLoading, error } = useQuery({
    ...getSamplesOptions({
      query: {
        page: search.page,
        per_page: search.per_page,
        sort_by: search.sort_by,
        sort_order: search.sort_order
      },
      path: {
        project_id: project.project_id
      }
    }),
    placeholderData: keepPreviousData // Makes pagination feel faster
  })

  if (isLoading) return <FullscreenSpinner variant='ellipsis' />
  if (error) return 'An error has occurred: ' + error.message
  if (!data) return 'No data was returned.'

  // Define fixed columns for sample_id and project_id
  const fixedColumns: Array<ColumnDef<SamplePublic>> = [
    {
      accessorKey: 'sample_id',
      header: ({ column }) => <SortableHeader column={column} name="Sample ID" />,
      cell: ({ getValue }) => {
        const value = getValue() as string
        return <CopyableText text={value} variant='hover' />
      }
    },
    {
      accessorKey: 'project_id',
      header: ({ column }) => <SortableHeader column={column} name="Project ID" />,
      cell: ({ getValue }) => {
        const value = getValue() as string
        return <CopyableText text={value} variant='hover' />
      }
    }
  ]

  // Define dynamic columns based on data_cols
  const dynamicColumns: Array<ColumnDef<SamplePublic>> = (data.data_cols || []).map((colName) => ({
    id: colName,
    accessorFn: (row) => {
      // Look up in attributes array
      const attr = row.attributes?.find((a) => a.key === colName)
      return attr?.value
    },
    header: ({ column }) => <SortableHeader column={column} name={colName} />,
    cell: ({ getValue }) => {
      const value = getValue() as string | undefined
      if (!value) {
        return <span className='text-muted-foreground italic'>Not found</span>
      }
      return <CopyableText text={value} variant='hover' />
    }
  }))

  // Combine fixed and dynamic columns
  const columns = [...fixedColumns, ...dynamicColumns]

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
            {data.data.length > 0 ? (
              <ServerDataTable
                data={data.data}
                columns={columns}
                pagination={pagination}
                onPaginationChange={setPagination}
                pageCount={data.total_pages}
                totalItems={data.total_items}
                sorting={sorting}
                onSortingChange={setSorting}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
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
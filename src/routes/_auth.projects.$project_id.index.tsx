import { useEffect, useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Building2, Cog, FolderCheck, FolderSearch, Pencil, PillBottle, Plus, Tag, Zap } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import type { SamplePublic } from '@/client/types.gen'
import type { ColumnDef } from '@tanstack/react-table'
import { CopyableText } from '@/components/copyable-text'
import { ClientDataTable } from '@/components/data-table/data-table'
import { SortableHeader } from '@/components/data-table/sortable-header'
import { ExecuteWorkflowForm } from '@/components/execute-workflow-form'
import { FileBrowserDialog } from '@/components/file-browser'
import { FileUpload } from '@/components/file-upload'
import { ValidateManifestForm } from '@/components/validate-manifest-form'
import { UpdateProjectForm } from '@/components/update-project-form'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// tooltip no longer needed for vendor card
import { highlightMatch, isValidHttpURL } from '@/lib/utils'
import { getSamples } from '@/client/sdk.gen'
import { FullscreenSpinner } from '@/components/spinner'
import { useColumnVisibilityStore } from '@/stores/column-visibility-store'
import { useAllPaginated } from '@/hooks/use-all-paginated'
import { getProjectByProjectIdOptions } from '@/client/@tanstack/react-query.gen'

export const Route = createFileRoute('/_auth/projects/$project_id/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { project_id } = Route.useParams()
  
  // Load project data using React Query for automatic refetching
  const { data: project } = useSuspenseQuery(
    getProjectByProjectIdOptions({
      path: { project_id }
    })
  )

  // Column visibility (persisted in Zustand store per project)
  const { getVisibility, setVisibility } = useColumnVisibilityStore()
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    getVisibility(project.project_id) || {}
  )

  // Global filter for search
  const [globalFilter, setGlobalFilter] = useState<string>('')

  // Sync column visibility to Zustand store when it changes
  useEffect(() => {
    setVisibility(project.project_id, columnVisibility)
  }, [columnVisibility, project.project_id, setVisibility])

  // Fetch all samples using the use-all-paginated hook
  const { data: allSamples, isLoading, error } = useAllPaginated({
    queryKey: ['samples', 'all', project.project_id],
    fetcher: ({ query }) => getSamples({
      path: { project_id: project.project_id },
      query
    }),
    perPage: 100, // Fetch 100 items per page
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  if (isLoading) return <FullscreenSpinner variant='ellipsis' />
  if (error) return 'An error has occurred: ' + error.message
  if (!allSamples) return 'No data was returned.'

  // Since we're using client-side rendering, we need to extract unique keys from sample attributes
  const dataColumns = allSamples.length > 0 ? 
    Array.from(new Set(allSamples.flatMap(sample => 
      sample.attributes?.map(attr => attr.key) || []
    ))) : []

  // Define fixed columns for sample_id and project_id
  const fixedColumns: Array<ColumnDef<SamplePublic>> = [
    {
      accessorKey: 'sample_id',
      header: ({ column }) => <SortableHeader column={column} name="Sample ID" />,
      cell: ({ getValue }) => {
        const value = getValue() as string
        return <CopyableText text={value} variant='hover' children={highlightMatch(value, globalFilter)} />
      }
    },
    {
      accessorKey: 'project_id',
      header: ({ column }) => <SortableHeader column={column} name="Project ID" />,
      cell: ({ getValue }) => {
        const value = getValue() as string
        return <CopyableText text={value} variant='hover' children={highlightMatch(value, globalFilter)} />
      }
    }
  ]

  // Define dynamic columns based on extracted data columns
  const dynamicColumns: Array<ColumnDef<SamplePublic>> = dataColumns.filter((colName): colName is string => colName !== null).map((colName: string) => ({
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
      return <CopyableText text={value} variant='hover' children={highlightMatch(value, globalFilter)} />
    }
  }))

  // Combine fixed and dynamic columns
  const columns = [...fixedColumns, ...dynamicColumns]

  return(
    <div className='animate-fade-in-up'>
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
              <UpdateProjectForm
                projectId={project.project_id}
                projectName={project.name}
                projectAttributes={project.attributes}
                trigger={
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
                }
              />
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
                        <CardTitle className='flex items-center gap-2 text-lg'>
                          <FolderSearch className='size-5 text-primary' />
                          Data Bucket
                        </CardTitle>
                        <CardDescription>
                          Browse and manage files in the data bucket for this project
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  )}
                  rootPath={`${project.data_folder_uri}`}
                />

                {/* Results Bucket */}
                <FileBrowserDialog
                  trigger={(
                    <Card className='cursor-pointer transition-colors hover:bg-accent/50'>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2 text-lg'>
                          <FolderCheck className='size-5 text-primary-2' />
                          Results Bucket
                        </CardTitle>
                        <CardDescription className='text-sm'>
                          View analysis results and outputs stored in the results bucket
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  )}
                  rootPath={`${project.results_folder_uri}`}
                />

                {/* Vendor Data */}
                <ValidateManifestForm
                  projectId={project.project_id}
                  trigger={(
                    <Card className='cursor-pointer transition-colors hover:bg-accent/50'>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2 text-lg'>
                          <Building2 className='size-5 text-primary' />
                          Vendor Data
                        </CardTitle>
                        <CardDescription className='text-sm'>
                          Validate vendor manifest files and ingest vendor data into this project
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  )}
                />

                {/* Execute Workflow */}
                <ExecuteWorkflowForm
                  trigger={(
                    <Card className='cursor-pointer transition-colors hover:bg-accent/50'>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2 text-lg'>
                          <Cog className='size-5 text-primary' />
                          Execute Workflow
                        </CardTitle>
                        <CardDescription className='text-sm'>
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
            {allSamples.length > 0 ? (
              <ClientDataTable
                data={allSamples}
                columns={columns}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                globalFilter={globalFilter}
                onFilterChange={setGlobalFilter}
                pageSize={5}
                isLoading={isLoading}
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
    </div>
  )
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Building2, Cog, Download, FolderCheck, FolderSearch, Pencil, PillBottle, Plus, Tag, Upload, Zap } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { SamplePublic } from '@/client/types.gen'
import type { ColumnDef, Table as ReactTable } from '@tanstack/react-table'
import { CopyableText } from '@/components/copyable-text'
import { EditableMetadataCell } from '@/components/editable-metadata-cell'
import { ClientDataTable } from '@/components/data-table/data-table'
import { SortableHeader } from '@/components/data-table/sortable-header'
import { ExecuteActionForm } from '@/components/execute-action-form'
import { FileBrowserDialog } from '@/components/file-browser'
import { ContainerDropzone, FileUpload } from '@/components/file-upload'
import { ValidateManifestForm } from '@/components/validate-manifest-form'
import { UpdateProjectForm } from '@/components/update-project-form'
import { ErrorState } from '@/components/error-state'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TableSelectionBanner } from '@/components/data-table/table-selection-banner'
import { highlightMatch, isValidHttpURL } from '@/lib/utils'
import { getProjectSamples } from '@/client/sdk.gen'
import { FullscreenSpinner } from '@/components/spinner'
import { TableProgressBanner } from '@/components/data-table/table-progress-banner'
import { useColumnVisibilityStore } from '@/stores/column-visibility-store'
import { useAllPaginated } from '@/hooks/use-all-paginated'
import { getProjectByProjectIdOptions, uploadSamplesFileMutation } from '@/client/@tanstack/react-query.gen'

const RESERVED_SAMPLE_COLUMN_IDS = new Set(['sample_id', 'project_id'])

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
  const samplesQueryKey = ['samples', 'all', project.project_id]
  const {
    data: allSamples,
    isLoading,
    isFetchingMore,
    loadedCount,
    totalCount,
    error,
    refetch,
  } = useAllPaginated({
    queryKey: samplesQueryKey,
    fetcher: ({ query }) => getProjectSamples({
      path: { project_id: project.project_id },
      query
    }),
    firstPagePerPage: 10,
    perPage: 250,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  const queryClient = useQueryClient()
  const { mutate: uploadSamples, isPending: isUploadingSamples } = useMutation({
    ...uploadSamplesFileMutation(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: samplesQueryKey })
      const created = response.samples_created
      toast.success(`Uploaded sample metadata (${created} sample${created === 1 ? '' : 's'} created)`)
    },
    onError: (err) => {
      toast.error(`Error uploading sample metadata: ${err.message || 'Unknown error'}`)
    },
  })

  const onSamplesDrop = useCallback((acceptedFiles: Array<File>) => {
    const file = acceptedFiles[0]
    uploadSamples({
      path: { project_id: project.project_id },
      body: { file },
    })
  }, [project.project_id, uploadSamples])

  const downloadSamplesAsTsv = useCallback((samples: Array<SamplePublic>) => {
    if (samples.length === 0) return
    const attributeColumns = Array.from(new Set(
      samples.flatMap(s => s.attributes?.map(a => a.key) || [])
    )).filter((name): name is string => name !== null && !RESERVED_SAMPLE_COLUMN_IDS.has(name))
    const headers = ['sample_id', 'project_id', ...attributeColumns]
    // TSV has no quoting; collapse tabs/newlines in cell values to single spaces.
    const sanitize = (v: unknown) => String(v ?? '').replace(/[\t\r\n]+/g, ' ')
    const rows = samples.map((s) => {
      const attrMap = new Map(s.attributes?.map((a) => [a.key, a.value]) || [])
      return [s.sample_id, s.project_id, ...attributeColumns.map((c) => attrMap.get(c) ?? '')]
        .map(sanitize)
        .join('\t')
    })
    const tsv = [headers.join('\t'), ...rows].join('\n')
    const blob = new Blob([tsv], { type: 'text/tab-separated-values;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.project_id}_samples.tsv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [project.project_id])

  const samplesFileInputRef = useRef<HTMLInputElement>(null)
  const samplesToolbar = (table: ReactTable<SamplePublic>) => (
    <>
      <input
        ref={samplesFileInputRef}
        type='file'
        accept='.csv,.tsv,.txt'
        className='hidden'
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onSamplesDrop([file])
          e.target.value = ''
        }}
      />
      <Button
        variant='outline'
        disabled={isUploadingSamples}
        onClick={() => samplesFileInputRef.current?.click()}
      >
        <Upload />
        {isUploadingSamples ? 'Uploading…' : 'Upload samples'}
      </Button>
      <Button
        variant='outline'
        disabled={isFetchingMore}
        onClick={() => downloadSamplesAsTsv(
          table.getCoreRowModel().rows.map((r) => r.original)
        )}
      >
        <Download />
        Download all samples
      </Button>
    </>
  )

  const samplesLoadingBanner = isFetchingMore ? (
    <TableProgressBanner loadedCount={loadedCount} totalCount={totalCount} noun='sample' />
  ) : null

  const samplesSelectionBanner = (table: ReactTable<SamplePublic>) => (
    <TableSelectionBanner
      table={table}
      actions={
        <Button
          variant='primary2'
          size='sm'
          onClick={() => downloadSamplesAsTsv(
            table.getSelectedRowModel().rows.map((r) => r.original)
          )}
        >
          <Download />
          Download selection
        </Button>
      }
    />
  )

  // Memoized column definitions. Derived from allSamples only — cell
  // renderers read globalFilter dynamically from the table state at render
  // time so highlight stays reactive without invalidating the columns
  // reference (which would cause TanStack to rebuild the entire column tree).
  const columns = useMemo<Array<ColumnDef<SamplePublic>>>(() => {
    const fixedColumns: Array<ColumnDef<SamplePublic>> = [
      {
        accessorKey: 'sample_id',
        header: ({ column }) => <SortableHeader column={column} name="Sample ID" />,
        cell: ({ getValue, table }) => {
          const value = getValue() as string
          const filter = (table.getState().globalFilter as string | undefined) ?? ''
          return <CopyableText text={value} variant='hover' children={highlightMatch(value, filter)} />
        },
      },
      {
        accessorKey: 'project_id',
        header: ({ column }) => <SortableHeader column={column} name="Project ID" />,
        cell: ({ getValue, table }) => {
          const value = getValue() as string
          const filter = (table.getState().globalFilter as string | undefined) ?? ''
          return <CopyableText text={value} variant='hover' children={highlightMatch(value, filter)} />
        },
      },
    ]

    if (allSamples.length === 0) return fixedColumns

    // Extract unique attribute keys, skipping any that collide with fixed columns.
    const dataColumns = Array.from(new Set(
      allSamples.flatMap((sample) => sample.attributes?.map((attr) => attr.key) || [])
    )).filter((name): name is string => name !== null && !RESERVED_SAMPLE_COLUMN_IDS.has(name))

    const dynamicColumns: Array<ColumnDef<SamplePublic>> = dataColumns.map((colName) => ({
      id: colName,
      accessorFn: (row) => row.attributes?.find((a) => a.key === colName)?.value,
      header: ({ column }) => <SortableHeader column={column} name={colName} />,
      cell: ({ getValue, row, table }) => {
        const value = getValue() as string | undefined
        const filter = (table.getState().globalFilter as string | undefined) ?? ''
        return (
          <EditableMetadataCell
            projectId={row.original.project_id}
            sampleId={row.original.sample_id}
            attributeKey={colName}
            value={value}
            globalFilter={filter}
            skipAutoResetPageIndex={table.options.meta?.skipAutoResetPageIndex}
          />
        )
      },
    }))

    return [...fixedColumns, ...dynamicColumns]
  }, [allSamples])

  if (isLoading) return <FullscreenSpinner variant='ellipsis' />
  if (error) return <ErrorState error={error} onRetry={() => { void refetch() }} />

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
                idPrefix={`project-${project.project_id}-update-project`}
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
                  idPrefix={`project-${project.project_id}-validate-manifest`}
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

                {/* Execute Action */}
                <ExecuteActionForm
                  idPrefix={`project-${project_id}-execute-action`}
                  projectId={project_id}
                  trigger={(
                    <Card className='cursor-pointer transition-colors hover:bg-accent/50'>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2 text-lg'>
                          <Cog className='size-5 text-primary' />
                          Execute Action
                        </CardTitle>
                        <CardDescription className='text-sm'>
                          Execute pipelines and actions on this project
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
              <ContainerDropzone
                onDrop={onSamplesDrop}
                subject={isUploadingSamples ? 'sample metadata (upload in progress)' : 'sample metadata'}
              >
                <ClientDataTable
                  data={allSamples}
                  columns={columns}
                  columnVisibility={columnVisibility}
                  onColumnVisibilityChange={setColumnVisibility}
                  globalFilter={globalFilter}
                  onFilterChange={setGlobalFilter}
                  pageSize={5}
                  isLoading={isLoading}
                  tableTools={samplesToolbar}
                  tableBanner={isFetchingMore ? samplesLoadingBanner : samplesSelectionBanner}
                  enableRowSelectionColumn
                />
              </ContainerDropzone>
            ) : (
                <FileUpload
                  onDrop={onSamplesDrop}
                  displayComponent={(
                    <span className="text-primary hover:underline mx-2">
                      {isUploadingSamples
                        ? 'Uploading sample metadata…'
                        : 'No sample metadata available. Drag and drop your sample metadata (TSV) here or click to select a file'}
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

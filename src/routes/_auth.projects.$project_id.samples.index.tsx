import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { CheckCircle2, Download, Plus, Upload } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { SamplePublic } from '@/client/types.gen'
import type { ColumnDef, Table as ReactTable, Row } from '@tanstack/react-table'
import type { SampleDiffResult } from '@/lib/sample-diff'
import { classifyBulkUploadItems } from '@/lib/sample-diff'
import { TableDiffBanner } from '@/components/data-table/table-diff-banner'
import { CopyableText } from '@/components/copyable-text'
import { ClientDataTable } from '@/components/data-table/data-table'
import { SortableHeader } from '@/components/data-table/sortable-header'
import { ContainerDropzone, FileUpload, SAMPLESHEET_ACCEPT } from '@/components/file-upload'
import { ErrorState } from '@/components/error-state'
import { Button } from '@/components/ui/button'
import { TableSelectionBanner } from '@/components/data-table/table-selection-banner'
import { highlightMatch } from '@/lib/utils'
import { getProjectSamples } from '@/client/sdk.gen'
import { FullscreenSpinner } from '@/components/spinner'
import { TableProgressBanner } from '@/components/data-table/table-progress-banner'
import { useColumnVisibilityStore } from '@/stores/column-visibility-store'
import { useAllPaginated } from '@/hooks/use-all-paginated'
import { getProjectByProjectIdOptions, uploadSamplesFileMutation } from '@/client/@tanstack/react-query.gen'

const RESERVED_SAMPLE_COLUMN_IDS = new Set(['sample_id'])

export const Route = createFileRoute('/_auth/projects/$project_id/samples/')({
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

  const [diff, setDiff] = useState<SampleDiffResult | null>(null)

  const queryClient = useQueryClient()
  const { mutate: uploadSamples, isPending: isUploadingSamples } = useMutation({
    ...uploadSamplesFileMutation(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: samplesQueryKey })
      const result = classifyBulkUploadItems(response.items)
      const { created, modified, unchanged } = result.counts

      // Only activate the diff view when something actually changed
      setDiff(created + modified > 0 ? result : null)

      // Always fire toast notification
      toast(
        `${created} new, ${modified} modified, ${unchanged} unchanged`,
        {
          icon: <CheckCircle2 className='size-4 text-success' />,
          cancel: { label: 'Dismiss', onClick: () => {} },
        }
      )
    },
    onError: (err) => {
      toast.error(`Error uploading sample metadata: ${err instanceof Error ? err.message : 'Unknown error'}`)
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
    const headers = ['sample_id', ...attributeColumns]
    // TSV has no quoting; collapse tabs/newlines in cell values to single spaces.
    const sanitize = (v: unknown) => String(v ?? '').replace(/[\t\r\n]+/g, ' ')
    const rows = samples.map((s) => {
      const attrMap = new Map(s.attributes?.map((a) => [a.key, a.value]) || [])
      return [s.sample_id, ...attributeColumns.map((c) => attrMap.get(c) ?? '')]
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
        {isUploadingSamples ? 'Uploading…' : 'Upload metadata'}
      </Button>
      <Button
        variant='outline'
        disabled={isFetchingMore}
        onClick={() => downloadSamplesAsTsv(
          table.getCoreRowModel().rows.map((r) => r.original)
        )}
      >
        <Download />
        Download all metadata
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
          Download selected
        </Button>
      }
    />
  )

  // Priority: loading > selection > diff. 
  const samplesTableBanner = (table: ReactTable<SamplePublic>) => {
    if (isFetchingMore) return samplesLoadingBanner
    if (table.getSelectedRowModel().rows.length > 0) return samplesSelectionBanner(table)
    if (diff) return <TableDiffBanner onDismiss={() => setDiff(null)} />
    return null
  }

  const samplesRowDecoration = useMemo(() => {
    if (!diff) return undefined
    const m = diff.statusBySampleId
    return {
      getRowClassName: (row: Row<SamplePublic>) => {
        const s = m.get(row.original.sample_id)
        if (s === 'created') return 'bg-green-50 hover:bg-green-100'
        if (s === 'updated') return 'bg-yellow-50 hover:bg-yellow-100'
        return undefined
      },
      gutterColumn: {
        id: '__diff_gutter__',
        cell: (row: Row<SamplePublic>) => {
          const s = m.get(row.original.sample_id)
          if (s === 'created') return <Plus className='size-4 text-green-700' aria-label='Created' />
          if (s === 'updated') return <span className='text-xs font-semibold text-yellow-800' aria-label='Modified'>M</span>
          return null
        },
      },
    }
  }, [diff])

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
      cell: ({ getValue, table }) => {
        const value = getValue() as string | undefined
        if (!value) return <span className='text-muted-foreground italic'>Not found</span>
        const filter = (table.getState().globalFilter as string | undefined) ?? ''
        return <CopyableText text={value} variant='hover' children={highlightMatch(value, filter)} />
      },
    }))

    return [...fixedColumns, ...dynamicColumns]
  }, [allSamples])

  if (isLoading) return <FullscreenSpinner variant='ellipsis' />
  if (error) return <ErrorState error={error} onRetry={() => { void refetch() }} />

  return (
    <div className='animate-fade-in-up pt-4'>
      {allSamples.length > 0 ? (
        <ContainerDropzone
          onDrop={onSamplesDrop}
          accept={SAMPLESHEET_ACCEPT}
          subject={isUploadingSamples ? 'sample metadata (upload in progress)' : 'sample metadata'}
        >
          <ClientDataTable
            data={allSamples}
            columns={columns}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            globalFilter={globalFilter}
            onFilterChange={setGlobalFilter}
            pageSize={10}
            isLoading={isLoading}
            tableTools={samplesToolbar}
            tableBanner={samplesTableBanner}
            rowDecoration={samplesRowDecoration}
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
    </div>
  )
}

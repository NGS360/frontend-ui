import { Link, createFileRoute, getRouteApi, useNavigate } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { useCallback, useEffect } from 'react'
import type { IlluminaSampleSheetResponseModel as RunSamplesheet } from '@/client/types.gen'
import { ClientDataTable } from '@/components/data-table/data-table'
import { SortableHeader } from '@/components/data-table/sortable-header'
import { CopyableText } from '@/components/copyable-text'
import { FullscreenDropzone } from '@/components/file-upload'
import { NotFoundComponent } from '@/components/samplesheet-not-found-component'
import { createFileMutation, getRunSamplesheetOptions, getRunSamplesheetQueryKey } from '@/client/@tanstack/react-query.gen'
import { FullscreenSpinner } from '@/components/spinner'

export const Route = createFileRoute('/runs/$run_barcode/samplesheet/')({
  component: RouteComponent,
  pendingComponent: () => <FullscreenSpinner variant='ellipsis' />,
  pendingMs: 200
})

function RouteComponent() {
  // Get route params
  const routeApi = getRouteApi('/runs/$run_barcode/samplesheet/')
  const { run_barcode } = routeApi.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient();
  
  // Use TanStack Query to fetch samplesheet data with custom error handling
  const { data: runInfo, isLoading, error, isError } = useQuery({
    ...getRunSamplesheetOptions({
      path: {
        run_barcode: run_barcode
      }
    }),
    retry: false, // Don't retry on errors to match loader behavior
    throwOnError: false, // Handle errors manually
  })

  // File upload mutation
  const { mutate } = useMutation({
    ...createFileMutation(),
    onSuccess: (data) => {
      console.log(data);
      // Invalidate the query for the run to refresh samplesheet info
      queryClient.invalidateQueries({
        queryKey: getRunSamplesheetQueryKey({
          path: {
            run_barcode: run_barcode
          }
        })
      });
      toast.success(`${data.filename} for run ${run_barcode} uploaded successfully`);
    },
    onError: (uploadError) => {
      console.error(uploadError);
    }
  })

  // File upload handler (moved to top to avoid hook order issues)
  const onDrop = useCallback((acceptedFiles: Array<File>) => {
    if (acceptedFiles.length > 0) {
      mutate({ body: {
        filename: acceptedFiles[0].name,
        content: acceptedFiles[0],
        entity_type: "run",
        entity_id: run_barcode,
        file_type: "samplesheet",
        created_by: "current_user",
        description: "Uploaded via UI",
        is_public: false
      }});
    } else {
      console.error("No files accepted");
    }
  }, [mutate, run_barcode])

  // Handle redirects and alerts for specific error cases
  useEffect(() => {
    if (isError) {
      // Handle AxiosError cases - redirect to /runs with alert
      if (error instanceof AxiosError) {
        const msg = "An error occurred: " + (error.response?.data?.detail || error.message || "An unknown error occurred.")
        alert(msg)
        navigate({ to: '/runs' })
        return
      }
      
      // Handle other non-404/204 errors
      if ((error as any).status !== 404 && (error as any).status !== 204) {
        alert('An unknown error occurred.')
        navigate({ to: '/runs' })
        return
      }
    }
  }, [isError, error, navigate])

  // Show loading spinner
  if (isLoading) {
    return <FullscreenSpinner variant='ellipsis' />
  }

  // Show not found component for 204 status or when no data
  if (isError && ((error as any).status === 204 || (error as any).status === 404)) {
    return <NotFoundComponent />
  }
  
  // Show not found component if no data but no error (edge case)
  if (!runInfo && !isError) {
    return <NotFoundComponent />
  }

  // If we still have an error at this point, the useEffect should handle it
  if (isError) {
    return <FullscreenSpinner variant='ellipsis' /> // Show spinner while redirect happens
  }

  // Transform header, reads, and settings 
  // into a list of key, value pairs
  const header = Object.entries(runInfo.Header || {})
  const reads = Object.entries(runInfo.Reads || {})
  const settings = Object.entries(runInfo.Settings || {})

  // Define columns for samplesheet
  type DataRow = NonNullable<RunSamplesheet["Data"]>[number]
  const columnHelper = createColumnHelper<DataRow>()
  const columns = runInfo.DataCols?.map((colName: string) =>
    columnHelper.accessor(colName, {
      header: ({ column }) => <SortableHeader column={column} name={colName} />,
      cell: (info) => {
        const value = info.getValue<string>()
        if (!value) return null;
        return colName === "Sample_Project" ? (
          <CopyableText
            text={value}
            variant='hoverLink'
            asChild={true}
            children={(
              <Link
                to='/projects/$project_id'
                params={{ project_id: value }}
                preload='intent' // backend should prevent invalid projectIds
              >
                {value}
              </Link>
            )}
          />
        ) : (
          <CopyableText
            text={value}
            variant='hover'
          />
        )
      }
    })
  )

  return (
    <>
      <FullscreenDropzone 
        subject='a new samplesheet'
        onDrop={onDrop}
      >
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col gap-4 md:grid md:grid-cols-2 '>

            {/* Samplesheet Header */}
            <div className='flex flex-col gap-2 md:row-span-2'>
              <h2 className='text-lg uppercase font-light text-primary'>Header</h2>
              <table>
                <tbody>
                  {header.map(([k, v]) => (
                    <tr key={k} className='border-t'>
                      <td className='p-2 align-top'>{k}</td>
                      <td className='p-2 whitespace-normal break-words break-all'>
                        {/* Reduce button padding to align items top */}
                        {v && (
                          <CopyableText
                            text={String(v)}
                            variant='hoverLight'
                            className='items-start [&>button]:p-[0.25em]'
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Reads */}
            <div className='flex flex-col gap-2'>
              <h2 className='text-lg uppercase font-light text-primary'>Reads</h2>
              <table>
                <tbody>
                  {reads.map(([k, v]) => (
                    <tr key={k} className='border-t'>
                      <td className='p-2 align-top'>{String(v)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Settings */}
            <div className='flex flex-col gap-2'>
              <h2 className='text-lg uppercase font-light text-primary'>Settings</h2>
              <table>
                <tbody>
                  {settings.map(([k, v]) => (
                    <tr key={k} className='border-t'>
                      <td className='p-2 align-top'>{k}</td>
                      <td className='p-2 whitespace-normal break-words break-all'>
                        {/* Reduce button padding to align items top */}
                        {v && (
                          <CopyableText
                            text={String(v)}
                            variant='hoverLight'
                            className='items-start [&>button]:p-[0.25em]'
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Data table */}
          <div className='flex flex-col gap-2'>
            <h2 className='text-lg uppercase font-light text-primary'>Data</h2>
            <div className='mb-15'>
              <ClientDataTable
                data={runInfo.Data ?? []}
                columns={columns ?? []}
              />
            </div>
          </div>
        </div>
      </FullscreenDropzone>
    </>
  )
}

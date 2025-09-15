import { Link, createFileRoute, getRouteApi, notFound, redirect } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { AxiosError } from 'axios'
import type { IlluminaSampleSheetResponseModel as RunSamplesheet } from '@/client/types.gen'
import { ClientDataTable } from '@/components/data-table/data-table'
import { SortableHeader } from '@/components/data-table/sortable-header'
import { CopyableText } from '@/components/copyable-text'
import { FullscreenDropzone } from '@/components/file-upload'
import { NotFoundComponent } from '@/components/samplesheet-not-found-component'
import { getRunSamplesheet } from '@/client'
import { FullscreenSpinner } from '@/components/spinner'

export const Route = createFileRoute('/runs/$run_barcode/samplesheet/')({
  component: RouteComponent,
  loader: async ({ params }) => {

    // Get run samplesheet data
    const res = await getRunSamplesheet({
      path: {
        run_barcode: params.run_barcode
      }
    });

    if (!res.data) {
      if (res.status === 204) throw notFound();
      if (res instanceof AxiosError) {
        const msg = "An error occurred: " + res.error.detail || "An unknown error occurred."
        alert(msg)
        throw redirect({ to: '/runs' })
      }
      alert('An unknown error occurred.')
      throw redirect({ to: '/runs'})
    }
    
    return ({
      runInfo: res.data
    })
  },
  notFoundComponent: NotFoundComponent,
  pendingComponent: () => <FullscreenSpinner variant='ellipsis' />,
  pendingMs: 200
})

function RouteComponent() {
  // Load run data
  const routeApi = getRouteApi('/runs/$run_barcode/samplesheet/')
  const { runInfo } = routeApi.useLoaderData()

  // Transform header, reads, and settings 
  // into a list of key, value pairs
  const header = Object.entries(runInfo.Header || [])
  const reads = Object.entries(runInfo.Reads || [])
  const settings = Object.entries(runInfo.Settings || [])

  // Define columns for samplesheet
  type DataRow = NonNullable<RunSamplesheet["Data"]>[number]
  const columnHelper = createColumnHelper<DataRow>()
  const columns = runInfo.DataCols?.map((colName) =>
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
      <FullscreenDropzone subject='a new samplesheet'>
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
                            text={v}
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
                      <td className='p-2 align-top'>{v}</td>
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
                            text={v}
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

import { Link, createFileRoute, getRouteApi, notFound, } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { ClientDataTable } from '@/components/data-table/data-table'
import { SortableHeader } from '@/components/data-table/sortable-header'
import { CopyableText } from '@/components/copyable-text'
import { FullscreenDropzone } from '@/components/file-upload'
import { NotFoundComponent } from '@/components/samplesheet-not-found-component'

// Define run samplesheet type (these will come later from the API)
export interface RunSamplesheet {
  Summary: {
    id: number,
    run_date: string,
    machine_id: string,
    run_number: string,
    run_time: string,
    flowcell_id: string,
    experiment_name: string,
    s3_run_folder_path: string,
    status: string,
    barcode: string
  },
  Header: {
    IEMFileVersion: string,
    InvestigatorName: string,
    ExperimentName: string,
    Date: string,
    Workflow: string,
    Application: string,
    InstrumentType: string,
    Assay: string,
    IndexAdapters: string,
    Chemistry: string
  },
  Reads: Array<number>,
  Settings: {},
  DataCols: Array<string>,
  Data: Array<Record<string, string>>
}

export const Route = createFileRoute('/runs/$run_barcode/samplesheet/')({
  component: RouteComponent,
  loader: async () => { // loader: async ({ params }) => {

    // Get run samplesheet data
    const res = await fetch('/data/example_run_samplesheet_data.json')
    // const res = new Response(null, {status: 404, statusText: "Not found"})
    if (!res.ok) {
      if (res.status === 404) {
        throw notFound()
      }
      if (res.status !== 200) {
        throw new Error("An error occurred: " + res.statusText || "An unknown error occurred.")
      }
    }
    
    const runSamplesheet: RunSamplesheet = await res.json()
    return ({
      runInfo: runSamplesheet
    })
  },
  notFoundComponent: NotFoundComponent
})

function RouteComponent() {
  // Load run data
  const routeApi = getRouteApi('/runs/$run_barcode/samplesheet/')
  const { runInfo } = routeApi.useLoaderData()

  // Transform header, reads, and settings 
  // into a list of key, value pairs
  const header = Object.entries(runInfo.Header)
  const reads = Object.entries(runInfo.Reads)
  const settings = Object.entries(runInfo.Settings)

  // Define columns for samplesheet
  type DataRow = RunSamplesheet["Data"][number]
  const columnHelper = createColumnHelper<DataRow>()
  const columns = runInfo.DataCols.map((colName) =>
    columnHelper.accessor(colName, {
      header: ({ column }) => <SortableHeader column={column} name={colName} />,
      // cell: info => info.getValue<string>()
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
                      <td className='p-2'>
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
                data={runInfo.Data}
                columns={columns}
              />
            </div>
          </div>
        </div>
      </FullscreenDropzone>
    </>
  )
}

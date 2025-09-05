import { Link, createFileRoute, getRouteApi, redirect } from '@tanstack/react-router'
import { AxiosError } from 'axios'
import {  createColumnHelper } from '@tanstack/react-table'
import { getRun } from '@/client'
import { ClientDataTable } from '@/components/data-table/data-table'
import { SortableHeader } from '@/components/data-table/sortable-header'
import { CopyableText } from '@/components/copyable-text'

// Define run metadata types (these will come later from the API)
interface ReadMetrics {
  ReadNumber?: number,
  Yield?: number,
  YieldQ30?: number,
  QualityScoreSum?: number,
  TrimmedBases?: number
}

interface RunMetadata {
  Flowcell?: string,
  RunNumber?: number,
  RunId?: string,
  ReadInfosForLanes?: [
    {
      LaneNumber?: number,
      ReadInfos?: [
        Number?: number,
        NumCycles?: number,
        IsIndexedRead?: boolean
      ]
    }
  ],
  ConversionResults?: [
    {
      LaneNumber?: number,
      TotalClustersRaw?: number,
      TotalClustersPF?: number,
      Yield?: number,
      DemuxResults?: [
        {
          SampleId?: string,
          SampleName?: string,
          IndexMetrics?: [
            {
              IndexSequence?: string,
              MismatchCounts?: {
               0: number,
               1: number 
              }
            }
          ],
          NumberReads?: number,
          Yield?: number,
          ReadMetrics?: Array<ReadMetrics>
        }
      ],
      Undetermined?: {
        NumberReads?: number,
        Yield?: number,
        ReadMetrics?: Array<ReadMetrics>
      }
    }
  ],
  UnknownBarcodes?: [
    {
      Lane?: number,
      Barcodes: Record<string, number>
    }
  ]
}

interface RunSamplesheet {
  Summary: {
    id: number,
    run_date: string,
    machine_id: string,
    run_number: string,
    run_time: string,
    flowcell_id: string,
    experiment_name:string,
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

export const Route = createFileRoute('/runs/$run_barcode/')({
  component: RouteComponent,
  loader: async ({ params }) => {
    // Get run data
    const runData = await getRun({
      path: {
        run_barcode: params.run_barcode
      }
    })
    if (runData.status !== 200 || runData instanceof AxiosError) {
      alert("An error occurred: " + runData.error?.detail || "An unknown error occurred.")
      throw redirect({ to: '/runs' })
    }

    // Get run samplesheet data
    const res = await fetch('/data/example_run_samplesheet_data.json')
    if (!res.ok) throw new Error('Unable to fetch run samplesheet data')
    const runSamplesheet: RunSamplesheet = await res.json()

    return ({
      crumb: runData.data.barcode,
      includeCrumbLink: true,
      run: runData.data,
      runInfo: runSamplesheet
    })
  }
})

function RouteComponent() {
  // Load run data
  const routeApi = getRouteApi('/runs/$run_barcode/')
  const { run, runInfo } = routeApi.useLoaderData()

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
      header: ({column}) => <SortableHeader column={column} name={colName} />,
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
                preload={false}
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
    <div className='flex flex-col gap-4'>

        {/* Header */}
        <h1 className='text-3xl font-extralight'>{run.barcode}</h1>
        <p className='text-muted-foreground'>{run.experiment_name}</p>
        <div className='flex flex-col gap-4 md:grid md:grid-cols-2 '>

          {/* Samplesheet Header */}
          <div className='flex flex-col gap-2 md:row-span-2'>
            <h2 className='text-xl uppercase font-light text-primary'>Header</h2>
            <table>
              <tbody>
                {header.map(([k, v]) => (
                  <tr key={k} className='border-t'>
                    <td className='p-2 align-top'>{k}</td>
                    <td className='p-2 align-top'>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Reads */}
          <div className='flex flex-col gap-2'>
            <h2 className='text-xl uppercase font-light text-primary'>Reads</h2>
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
            <h2 className='text-xl uppercase font-light text-primary'>Settings</h2>
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
          <h2 className='text-xl uppercase font-light text-primary'>Data</h2>
          <ClientDataTable
            data={runInfo.Data}
            columns={columns}
          />
        </div>
    </div>
    </>
  )
}

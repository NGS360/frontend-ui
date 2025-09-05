import { Outlet, createFileRoute, getRouteApi, redirect } from '@tanstack/react-router'
import { AxiosError } from 'axios'
import { ChartBar, FileSpreadsheet } from 'lucide-react'
import { getRun } from '@/client'
import { TabLink, TabNav } from '@/components/tab-nav'

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

export const Route = createFileRoute('/runs/$run_barcode')({
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
  // Load project data
  const routeApi = getRouteApi('/runs/$run_barcode')
  const { run } = routeApi.useLoaderData()

  return (
    <>
      <div className='flex flex-col gap-4'>
        {/* Header and tab navigation */}
        <h1 className='text-3xl font-extralight'>{run.barcode}</h1>
        <p className='text-muted-foreground'>{run.experiment_name}</p>
        <div className='flex gap-2 flex-col md:flex-row md:h-9 md:items-center'>
          <TabNav>
            <TabLink
              to='/runs/$run_barcode/samplesheet'
              params={{ run_barcode: run.barcode as string }}
            >
              <FileSpreadsheet /><span>Samplesheet</span>
            </TabLink>
            <TabLink
              to='/runs/$run_barcode/indexqc'
              params={{ run_barcode: run.barcode as string }}
            >
              <ChartBar /><span>IndexQC</span>
            </TabLink>
          </TabNav>
        </div>
        {/* Tab nav outlet */}
        <Outlet />
      </div>
    </>
  )
}

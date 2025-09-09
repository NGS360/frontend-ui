import { Outlet, createFileRoute } from '@tanstack/react-router'

export const RouteComponent = () => (
  <>
    <Outlet />
  </>
)

// Define run metadata types (these will come later from the API)
interface ReadMetrics {
  ReadNumber?: number,
  Yield?: number,
  YieldQ30?: number,
  QualityScoreSum?: number,
  TrimmedBases?: number
}

interface RunMetrics {
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
      LaneNumber: number,
      TotalClustersRaw: number,
      TotalClustersPF: number,
      Yield?: number,
      DemuxResults?: [
        {
          SampleId: string,
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
          NumberReads: number,
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

export const Route = createFileRoute('/runs/$run_barcode/indexqc')({
  component: RouteComponent,
  loader: async () => { // loader: async ({ params }) => {
  
      // Get run metrics data
      const res = await fetch('/data/example_run_metrics_data2.json')
      if (!res.ok) throw new Error('Unable to fetch run metrics data')
      const runMetrics: RunMetrics = await res.json()
  
      return ({
        crumb: 'IndexQC',
        includeCrumbLink: true,
        runMetrics: runMetrics
      })
    },
})
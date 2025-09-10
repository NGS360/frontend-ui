import { createFileRoute, getRouteApi, notFound } from '@tanstack/react-router'
import { useState } from 'react';
import type {ColumnDef, Row} from '@tanstack/react-table';
import type {BarChartData} from '@/components/indexqc-barchart';
import { CopyableText } from '@/components/copyable-text'
import { SortableHeader } from '@/components/data-table/sortable-header'
import { ClientDataTable } from '@/components/data-table/data-table';
import { useIsMobile } from '@/hooks/use-mobile';
import {  IndexQCBarChart } from '@/components/indexqc-barchart';
import { NotFoundComponent } from '@/components/indexq-not-found-component';

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

export const Route = createFileRoute('/runs/$run_barcode/indexqc/')({
  component: RouteComponent,
  loader: async () => { // loader: async ({ params }) => {

    // Get run metrics data
    // const res = await fetch('/data/example_run_metrics_data2.json')
    const res = new Response(null, {status: 404, statusText: "Not found"})
    if (!res.ok) {
      if (res.status === 404) {
        throw notFound()
      }
      if (res.status !== 200) {
        throw new Error("An error occurred: " + res.statusText || "An unknown error occurred.")
      }
    }

    const runMetrics: RunMetrics = await res.json()
    return ({
      runMetrics: runMetrics
    })
  },
  notFoundComponent: NotFoundComponent
})

// Define data shape for the Read count table
interface ReadCountData {
  Lane: number,
  "Total Reads": number,
  "PF Reads": number
}

function RouteComponent() {
  // Load run data
  const routeApi = getRouteApi('/runs/$run_barcode/indexqc/')
  const { runMetrics } = routeApi.useLoaderData()

  // Get mobile state
  const isMobile = useIsMobile();

  // Map data for the table and barchart
  const readCountData: Array<ReadCountData> = []
  const barChartData: Array<BarChartData> = []
  runMetrics.ConversionResults?.forEach((d) => {

    // Compute the total number of reads per lane
    readCountData.push({
      Lane: d.LaneNumber,
      "Total Reads": d.TotalClustersRaw * 2,
      "PF Reads": d.TotalClustersPF * 2
    })

    // Compute the barchart data
    d.DemuxResults?.forEach(res => {
      const pct = (res.NumberReads / d.TotalClustersPF) * 100
      barChartData.push({
        lane: d.LaneNumber,
        sampleId: res.SampleId,
        pctReadsIdentified: pct.toFixed(3)
      })
    })
  })

  // Set state for filtering data and setting plot height
  const [lane, setLane] = useState<number>();
  const [filteredBarChartData, setFilteredBarChartData] = useState<Array<BarChartData>>()

  // Handle row click callback
  const handleRowClick = (row: Row<ReadCountData>) => {
    // Set lane
    const rowLane = Number(row.getValue('Lane'))
    setLane(rowLane)

    // Filter barChartData by selected lane
    const filteredData = barChartData.filter(value => value.lane == rowLane)
    setFilteredBarChartData(filteredData)
  }

  // Define columns for metrics table 
  const columns: Array<ColumnDef<ReadCountData>> = [
    {
      accessorKey: 'Lane',
      header: ({ column }) => <SortableHeader column={column} name="Lane" />,
      cell: ({ cell }) => {
        const value = cell.getValue() as string
        return (
          <CopyableText
            text={value}
            variant='hover'
          />
        )
      }
    },
    {
      accessorKey: "Total Reads",
      header: ({ column }) => <SortableHeader column={column} name="Total Reads" />,
      cell: ({ cell }) => {
        const value = cell.getValue() as string
        return (
          <CopyableText
            text={value.toLocaleString()}
            variant='hover'
          />
        )
      }
    },
    {
      accessorKey: "PF Reads",
      header: ({ column }) => <SortableHeader column={column} name="PF Reads" />,
      cell: ({ cell }) => {
        const value = cell.getValue() as string
        return (
          <CopyableText
            text={value.toLocaleString()}
            variant='hover'
          />
        )
      }
    }
  ]

  return (
    <>
      <ClientDataTable 
        data={readCountData}
        columns={columns}
        rowClickCallback={handleRowClick}
      />
      {filteredBarChartData && (
        <IndexQCBarChart
          barChartData={filteredBarChartData}
          title={`Lane ${lane}`}
          isMobile={isMobile}
        />
      )}
    </>
  )
}

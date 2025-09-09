import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { useState } from 'react';
import type {ColumnDef, Row} from '@tanstack/react-table';
import type {BarChartData} from '@/components/indexqc-barchart';
import { CopyableText } from '@/components/copyable-text'
import { SortableHeader } from '@/components/data-table/sortable-header'
import { ClientDataTable } from '@/components/data-table/data-table';
import { useIsMobile } from '@/hooks/use-mobile';
import {  IndexQCBarChart } from '@/components/indexqc-barchart';


export const Route = createFileRoute('/runs/$run_barcode/indexqc/')({
  component: RouteComponent,
})

// Define data shape for the Read count table
interface ReadCountData {
  Lane: number,
  "Total Reads": number,
  "PF Reads": number
}

function RouteComponent() {
  // Load run data
  const routeApi = getRouteApi('/runs/$run_barcode/indexqc')
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
  const [plotHeight, setPlotHeight] = useState<string | number>(600);

  // Handle row click callback
  const handleRowClick = (row: Row<ReadCountData>) => {
    // Set lane
    const rowLane = Number(row.getValue('Lane'))
    setLane(rowLane)

    // Filter barChartData by selected lane
    const filteredData = barChartData.filter(value => value.lane == rowLane)
    setFilteredBarChartData(filteredData)

    // Compute plot height
    setPlotHeight(filteredData.length * 55)
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
          height={plotHeight}
        />
      )}
    </>
  )
}

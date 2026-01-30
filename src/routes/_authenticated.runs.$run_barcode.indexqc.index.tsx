import { createFileRoute, getRouteApi, notFound, redirect } from '@tanstack/react-router'
import { useState } from 'react';
import { AxiosError } from 'axios';
import type {ColumnDef, Row} from '@tanstack/react-table';
import type {BarChartData} from '@/components/indexqc-barchart';
import { CopyableText } from '@/components/copyable-text'
import { SortableHeader } from '@/components/data-table/sortable-header'
import { ClientDataTable } from '@/components/data-table/data-table';
import { useIsMobile } from '@/hooks/use-mobile';
import {  IndexQCBarChart } from '@/components/indexqc-barchart';
import { NotFoundComponent } from '@/components/indexqc-not-found-component';
import { getRunMetrics } from '@/client';
import { FullscreenSpinner } from '@/components/spinner';

export const Route = createFileRoute('/_authenticated/runs/$run_barcode/indexqc/')({
  component: RouteComponent,
  loader: async ({ params }) => {

    // Get run metrics data
    const res = await getRunMetrics({
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
      runMetrics: res.data
    })
  },
  notFoundComponent: NotFoundComponent,
  pendingComponent: () => <FullscreenSpinner variant='ellipsis' />,
  pendingMs: 200
})

// Define data shape for the Read count table
interface ReadCountData {
  Lane: number,
  "Total Reads": number,
  "PF Reads": number
}

function RouteComponent() {
  // Load run data
  const routeApi = getRouteApi('/_authenticated/runs/$run_barcode/indexqc/')
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
      const pct = ((res.NumberReads || 0) / d.TotalClustersPF) * 100
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
    <div className='animate-fade-in-up'>
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
    </div>
  )
}

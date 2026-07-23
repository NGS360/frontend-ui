// TEMPORARY - side-by-side harness for the recharts -> CanvasXpress migration.
// To remove: point the Index QC route back at <IndexQCBarChart>, then delete this file,
// indexqc-barchart-recharts.tsx, and the recharts dependency.
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IndexQCBarChart } from "@/components/indexqc-barchart"
import { IndexQCBarChartRecharts } from "@/components/indexqc-barchart-recharts"
import type { BarChartData } from "@/components/indexqc-barchart"

interface IndexQCBarChartComparisonProps {
  barChartData: Array<BarChartData>,
  title?: string,
  isMobile?: boolean
}

export const IndexQCBarChartComparison: React.FC<IndexQCBarChartComparisonProps> = ({
  barChartData,
  title,
  isMobile = false
}) => (
  // Radix unmounts the inactive tab, so each switch rebuilds the chart from scratch -
  // which means the entry animation replays and both get a fair first-render comparison
  <Tabs defaultValue="canvasxpress" className="mt-6">
    <div className="flex items-center gap-3">
      <TabsList>
        <TabsTrigger value="canvasxpress">CanvasXpress</TabsTrigger>
        <TabsTrigger value="recharts">recharts</TabsTrigger>
      </TabsList>
      <span className="text-muted-foreground text-xs">
        Temporary comparison - switch tabs to compare the two renderers
      </span>
    </div>

    <TabsContent value="canvasxpress">
      <IndexQCBarChart
        barChartData={barChartData}
        title={title}
        isMobile={isMobile}
      />
    </TabsContent>

    <TabsContent value="recharts">
      <IndexQCBarChartRecharts
        barChartData={barChartData}
        title={title}
        isMobile={isMobile}
      />
    </TabsContent>
  </Tabs>
)

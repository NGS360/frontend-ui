import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  LabelList, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from "recharts"

// Define IndexQC Bar Chart component
export interface BarChartData {
  lane: number,
  sampleId: string,
  pctReadsIdentified: string
}

interface IndexQCBarChartProps {
  barChartData: Array<BarChartData>,
  title?: string,
  isMobile?: boolean
  width?: string | number
  height?: string | number
}

export const IndexQCBarChart: React.FC<IndexQCBarChartProps> = ({
  barChartData,
  title,
  isMobile = false,
  width = "100%",
  height = 500
}) => (
  <>
    {title && <h1>{title}</h1>}
    <ResponsiveContainer width={width} height={height} className="m-auto mb-15">
      <BarChart
        data={barChartData}
        layout="vertical"
        margin={{ top: 20, right: 50, left: 80, bottom: 20 }}
      >
        <CartesianGrid
          horizontal={false}
          stroke='#ddd'
          strokeDasharray="3 3"
        />

        <XAxis
          type="number"
          tickFormatter={(val) => `${val}`}
          domain={[0, 'auto']}
          axisLine={false}
          tickLine={false}
          label={{
            value: '% Reads Identified (PF)',
            position: 'bottom'
          }}
        />

        <YAxis
          dataKey="sampleId"
          type="category"
          width={100}
          hide={isMobile}
          axisLine={false}
          tickLine={false}
        />

        <Tooltip
          formatter={(value: string) => `${value}%`}
          labelFormatter={(label: string) => `Sample: ${label}`}
          cursor={false}
        />

        <Bar
          dataKey="pctReadsIdentified"
          fill="var(--chart-3)"
          isAnimationActive={true}
          radius={5}
        >
          {/* Optional: show value tags on each bar */}
          <LabelList
            dataKey="pctReadsIdentified"
            position="right"
            formatter={(label) => `${label}%`}
          />
        </Bar>

      </BarChart>
    </ResponsiveContainer>
  </>
)
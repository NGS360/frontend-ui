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
    <ResponsiveContainer width={width} height={height} className="m-auto mb-10">
      <BarChart
        data={barChartData}
        layout="horizontal"
        margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
      >
        <CartesianGrid
          vertical={false}
          stroke='#ddd'
          strokeDasharray="3 3"
        />

        <YAxis
          type="number"
          tickFormatter={(val) => `${val}`}
          domain={[0, 'auto']}
          axisLine={false}
          tickLine={false}
          label={{
            value: '% Reads Identified (PF)',
            angle: -90,
            dx: -20
          }}
        />

        <XAxis
          dataKey="sampleId"
          type="category"
          width={100}
          axisLine={false}
          tickLine={false}
          tick={false}
          angle={45}
          dy={50}
          dx={50}
          label={{
            value: 'Sample',
            dy: 20
          }}
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
          {!isMobile && (
            <LabelList
              dataKey="pctReadsIdentified"
              position="top"
              formatter={(label) => `${label}%`}
            />
          )}
        </Bar>

      </BarChart>
    </ResponsiveContainer>
  </>
)
import { useEffect, useId, useRef } from 'react'
import CanvasXpress from 'canvasxpress'
import 'canvasxpress/src/canvasXpress.css'

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
  width?: number | `${number}%`
  height?: number | `${number}%`
}

/**
 * The single series in the y-matrix. CanvasXpress uses the variable name as the
 * value-axis label in the tooltip, so it doubles as the axis title.
 */
const SERIES_NAME = '% Reads Identified (PF)'

/** Read a CSS custom property. CanvasXpress parses the value (including oklch); it
 *  just cannot resolve `var(--x)` itself, since it paints to a canvas. */
function cssVar(token: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim()
  return value || fallback
}

/** Reshape the flat rows into the CanvasXpress wide matrix (one row, N columns). */
function toCanvasXpressData(rows: Array<BarChartData>): CanvasXpress.CXData {
  return {
    y: {
      vars: [SERIES_NAME],
      smps: rows.map((d) => d.sampleId),
      data: [rows.map((d) => Number(d.pctReadsIdentified))]
    },
    // Carried as a sample annotation so the lane shows up on hover.
    x: {
      Lane: rows.map((d) => d.lane)
    }
  }
}

function buildConfig(isMobile: boolean): CanvasXpress.CXConfig {
  const textColor = cssVar('--foreground', 'oklch(0.145 0 0)')

  return {
    graphType: 'Bar',
    graphOrientation: 'vertical',

    // In a CanvasXpress 1D plot the *value* axis is the x axis, and the
    // categorical axis is the "sample" axis — hence xAxisTitle vs smpTitle.
    xAxisTitle: SERIES_NAME,
    xAxisTitleColor: textColor,
    setMinX: 0,

    // Recharts equivalent: <CartesianGrid vertical={false} />
    xAxisGridMajorShow: true,
    xAxisGridMinorShow: false,
    xAxisGridMajorColor: 'rgb(221,221,221)',
    xAxisTicksShow: false,

    // Hundreds of samples per lane, so label the axis but not each tick.
    smpTitle: 'Sample',
    smpTitleColor: textColor,
    showSampleNames: false,

    // Recharts equivalent: <LabelList position="top" />, suppressed on mobile.
    showDataValues: !isMobile,
    dataValuesPosition: 'outside',

    // One series, so a legend would carry no information.
    showLegend: false,

    colors: [cssVar('--chart-3', 'oklch(0.398 0.07 227.392)')],
    background: 'transparent',
    margin: 20
  }
}

export const IndexQCBarChart: React.FC<IndexQCBarChartProps> = ({
  barChartData,
  title,
  isMobile = false,
  width = "100%",
  height = 500
}) => {
  // CanvasXpress binds to a canvas by id, so each instance needs its own.
  const instanceId = useId().replace(/[^a-zA-Z0-9]/g, '')
  const targetId = `indexqc-barchart-${instanceId}`

  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<CanvasXpress.CanvasXpressInstance | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || barChartData.length === 0) return

    // NOTE: deliberately NO ResizeObserver here.
    //
    // Observing this container and calling setDimensions() from the callback is
    // a feedback loop: the resize mutates the canvas inside the observed
    // element, which retriggers the observer, which resizes again. Undebounced,
    // that blocks the main thread and the tab goes unresponsive.
    //
    // The chart is sized once from the container box. It rebuilds whenever
    // barChartData or isMobile changes, which covers the cases this component
    // actually has. If responsive resize is wanted later, drive it from a
    // window 'resize' listener (debounced, and only when the size really
    // changed) rather than from a ResizeObserver on the element being resized.

    // The canvas is created here rather than rendered by React: CanvasXpress
    // moves the target into a generated `<target>-cX-DOM` wrapper on init, and
    // what teardown leaves behind is not reliably React's node. Owning it here
    // means every build starts from a known-empty container.
    container.replaceChildren()

    // Chart construction is deferred one macrotask. CanvasXpress's init has
    // async stages, and destroy() during that window leaves its module-level
    // state confused (the next instance never leaves its loading spinner).
    // Under StrictMode the first mount is torn down synchronously, so with the
    // deferral the throwaway mount never constructs a chart at all.
    const timer = setTimeout(() => {
      // Measure while the container is empty, so the box is the layout's own.
      const rect = container.getBoundingClientRect()
      const canvas = document.createElement('canvas')
      canvas.id = targetId
      canvas.width = Math.max(320, Math.round(rect.width))
      canvas.height = Math.max(240, Math.round(rect.height))
      container.appendChild(canvas)

      // `init` is the constructor on the module namespace.
      chartRef.current = new CanvasXpress.init(
        targetId,
        toCanvasXpressData(barChartData),
        buildConfig(isMobile)
      )
    }, 0)

    return () => {
      clearTimeout(timer)
      try {
        chartRef.current?.destroy()
      } catch {
        // Already torn down.
      }
      chartRef.current = null
      container.replaceChildren()
    }
  }, [barChartData, isMobile, targetId])

  return (
    <>
      {title && <h1>{title}</h1>}
      <div ref={containerRef} style={{ width, height }} className="m-auto mb-10" />
    </>
  )
}

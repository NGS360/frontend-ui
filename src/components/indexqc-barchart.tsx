import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { useCanvasXpress } from "@/hooks/use-canvasxpress"
import { useDebounce } from "@/hooks/use-debounce"
import type { CanvasXpressConfig, CanvasXpressData } from "@/canvasxpress"

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

/** Colours the chart picks up from the stylesheet so it tracks the active theme */
interface ChartColors {
  bar: string
  text: string
}

const VALUE_AXIS_TITLE = "% Reads Identified (PF)"
const GRID_COLOR = "#ddd"
const FALLBACK_COLORS: ChartColors = { bar: "#2d6a8e", text: "#666" }

/**
 * Canvas cannot paint `var(--chart-3)` directly, and CanvasXpress rejects any colour
 * it cannot parse - which includes the `oklch()` values the stylesheet is written in.
 * Rasterise the value to a single pixel and read the concrete channels back out.
 */
const resolveCssColor = (property: string, fallback: string): string => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(property).trim()
  if (!value) return fallback

  const canvas = document.createElement("canvas")
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return fallback

  ctx.fillStyle = fallback
  ctx.fillStyle = value
  ctx.fillRect(0, 0, 1, 1)

  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return `rgb(${r}, ${g}, ${b})`
}

/** Re-resolves the chart colours whenever the document theme changes */
const useChartColors = (): ChartColors => {
  const read = useCallback((): ChartColors => ({
    bar: resolveCssColor("--chart-3", FALLBACK_COLORS.bar),
    text: resolveCssColor("--muted-foreground", FALLBACK_COLORS.text)
  }), [])

  const [colors, setColors] = useState<ChartColors>(read)

  useEffect(() => {
    const observer = new MutationObserver(() => setColors(read()))
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"]
    })
    return () => observer.disconnect()
  }, [read])

  return colors
}

/** Resolves a px number or a percentage against the space the container was given */
const resolveLength = (
  value: number | `${number}%`,
  available: number,
  fallback: number
): number => {
  if (typeof value === "number") return value
  const pct = Number.parseFloat(value)
  if (Number.isNaN(pct)) return fallback
  return available > 0 ? (available * pct) / 100 : fallback
}

export const IndexQCBarChart: React.FC<IndexQCBarChartProps> = ({
  barChartData,
  title,
  isMobile = false,
  width = "100%",
  height = 500
}) => {
  const CanvasXpress = useCanvasXpress()
  const colors = useChartColors()

  const containerRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<{ width: number, height: number }>()

  // CanvasXpress addresses its canvas by element id, so keep one stable id per instance
  const target = `indexqc-barchart-${useId().replace(/[^a-zA-Z0-9]/g, "")}`

  // Track the container so the chart fills it the way ResponsiveContainer used to
  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const observer = new ResizeObserver(([entry]) => {
      setBox({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // CanvasXpress only resizes its canvas, not the wrapper it builds around it, so the
  // chart is rebuilt at the new size instead. Debounce so a drag rebuilds once, not
  // once per frame - ResponsiveContainer did the same.
  const canvasWidth = useDebounce(box ? Math.round(resolveLength(width, box.width, 600)) : 0, 150)
  const canvasHeight = useDebounce(box ? Math.round(resolveLength(height, box.height, 500)) : 0, 150)

  const data = useMemo<CanvasXpressData>(() => {
    // Sample ids are the axis keys and have to be unique, but a lane can repeat one.
    // Keep a unique key per bar and carry the real id as an annotation for the tooltip.
    const seen = new Map<string, number>()
    const smps: Array<string> = []
    const sampleIds: Array<string> = []
    const values: Array<number> = []

    barChartData.forEach((d) => {
      const count = seen.get(d.sampleId) ?? 0
      seen.set(d.sampleId, count + 1)

      smps.push(count === 0 ? d.sampleId : `${d.sampleId} (${count + 1})`)
      sampleIds.push(d.sampleId)
      values.push(Number(d.pctReadsIdentified))
    })

    return {
      y: { vars: [VALUE_AXIS_TITLE], smps, data: [values] },
      x: { Sample: sampleIds }
    }
  }, [barChartData])

  const config = useMemo<CanvasXpressConfig>(() => ({
    graphType: "Bar",
    graphOrientation: "vertical",
    showLegend: false,

    // The bars are the only series, so the axis titles carry all the labelling
    showSampleNames: false,
    smpTitle: "Sample",
    xAxisTitle: VALUE_AXIS_TITLE,
    setMinX: 0,

    // CanvasXpress sizes axis titles far larger than recharts did by default
    smpTitleScaleFontFactor: 0.65,
    xAxisTitleScaleFontFactor: 0.85,

    // Horizontal dashed gridlines only, matching the previous CartesianGrid
    xAxisGridMajorShow: true,
    xAxisGridMajorColor: GRID_COLOR,
    xAxisGridMajorLineType: "dashed",
    xAxisGridMinorShow: false,
    yAxisGridMajorShow: false,
    yAxisGridMinorShow: false,
    xAxisTicksShow: false,
    xAxisLineBottomShow: false,

    // Value above each bar, dropped on mobile where there is no room for it
    showDataValues: !isMobile,
    dataValuesPosition: "outside",
    dataTextColor: colors.text,

    useRoundRectangles: true,
    roundedPolygonRadius: 5,
    showTransition: true,

    colors: [colors.bar],
    background: "transparent",
    xAxisTitleColor: colors.text,
    xAxisTextColor: colors.text,
    smpTitleColor: colors.text,

    hoverTemplate: "Sample: {Sample}<br>{data}%"
  }), [colors, isMobile])

  // Build the graph once the library, the container size and the data are all ready.
  // CanvasXpress rehomes the canvas into a wrapper of its own, so create that subtree
  // imperatively - React must not own nodes another library is going to move.
  useEffect(() => {
    const container = containerRef.current
    if (!CanvasXpress || !container || canvasWidth <= 0 || canvasHeight <= 0) return

    const host = document.createElement("div")
    const canvas = document.createElement("canvas")
    canvas.id = target
    canvas.width = canvasWidth
    canvas.height = canvasHeight
    host.appendChild(canvas)
    container.appendChild(host)

    new CanvasXpress(target, data, config)

    return () => {
      // The constructor hands back nothing useful; tearing the chart down - and the
      // wrapper DOM it built - goes through the static call. Instances register
      // asynchronously, so this can run before the chart ever finished rendering.
      try {
        CanvasXpress.destroy(target)
      } catch {
        // Nothing had registered under this id yet, so there is nothing to tear down
      }
      container.replaceChildren()
    }
  }, [CanvasXpress, target, data, config, canvasWidth, canvasHeight])

  return (
    <>
      {title && <h1>{title}</h1>}
      <div
        ref={containerRef}
        className="m-auto mb-10"
        style={{
          width: typeof width === "number" ? `${width}px` : width,
          height: typeof height === "number" ? `${height}px` : height
        }}
      />
    </>
  )
}

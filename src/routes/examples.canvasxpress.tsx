import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { IndexQCBarChart } from '@/components/indexqc-barchart'
import { indexqcSample, indexqcSampleLanes } from '@/fixtures/indexqc-sample'
import { useIsMobile } from '@/hooks/use-mobile'

/**
 * Standalone CanvasXpress example — visit /examples/canvasxpress.
 *
 * Renders the real `IndexQCBarChart` against captured fixture data, so the
 * chart can be developed and reviewed without a sequencing run, a back end,
 * or an authenticated session. Deliberately not nested under `_auth`.
 */
export const Route = createFileRoute('/examples/canvasxpress')({
  component: CanvasXpressExample
})

function CanvasXpressExample() {
  const detectedMobile = useIsMobile()

  const [lane, setLane] = useState<number>(indexqcSampleLanes[0])
  const [forceMobile, setForceMobile] = useState(false)

  // Same filter the real route applies when a lane row is clicked.
  const barChartData = useMemo(
    () => indexqcSample.filter((d) => d.lane === lane),
    [lane]
  )

  return (
    <div className="p-6 animate-fade-in-up">
      <h2 className="text-xl font-semibold">CanvasXpress bar chart</h2>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">
        {`IndexQCBarChart rendered from fixture data — run 260807_VH01122_95_AACHV3WHV, `}
        {`${barChartData.length} samples in lane ${lane}.`}
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        {indexqcSampleLanes.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setLane(n)}
            className={
              'rounded-md border px-3 py-1.5 text-sm transition-colors ' +
              (n === lane
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-accent')
            }
          >
            {`Lane ${n}`}
          </button>
        ))}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={forceMobile}
            onChange={(e) => setForceMobile(e.target.checked)}
          />
          {'Force isMobile (hides the value labels)'}
        </label>
      </div>

      <IndexQCBarChart
        barChartData={barChartData}
        title={`Lane ${lane}`}
        isMobile={forceMobile || detectedMobile}
      />
    </div>
  )
}

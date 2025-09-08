import { createFileRoute, getRouteApi } from '@tanstack/react-router'

export const Route = createFileRoute('/runs/$run_barcode/indexqc/')({
  component: RouteComponent,
})

function RouteComponent() {
  // Load run data
  const routeApi = getRouteApi('/runs/$run_barcode/indexqc')
  const { runMetrics } = routeApi.useLoaderData()

  return (
    <>
      <pre>{JSON.stringify(runMetrics, null, 2)}</pre>
    </>
  )
}

import { Outlet, createFileRoute } from '@tanstack/react-router'

const RouteComponent = () => (
  <>
    <Outlet />
  </>
)

export const Route = createFileRoute('/_home/runs/$run_barcode/samplesheet')({
  component: RouteComponent,
  loader: () => {
    return ({
      crumb: 'Samplesheet',
      includeCrumbLink: true,
    })
  }
})

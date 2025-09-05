import { Outlet, createFileRoute } from '@tanstack/react-router'

export const RouteComponent = () => (
  <>
    <Outlet />
  </>
)

export const Route = createFileRoute('/runs/$run_barcode/samplesheet')({
  component: RouteComponent,
  loader: () => ({
    crumb: 'Samplesheet',
    includeCrumbLink: true,
  }),
})

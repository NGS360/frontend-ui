import { Outlet, createFileRoute } from '@tanstack/react-router'

export const RouteComponent = () => (
  <>
    <Outlet />
  </>
)

export const Route = createFileRoute('/runs/$run_barcode/indexqc')({
  component: RouteComponent,
  loader: () => { 
      return ({
        crumb: 'IndexQC',
        includeCrumbLink: true,
      })
    },
})
import { Outlet, createFileRoute } from '@tanstack/react-router'

export const RouteComponent = () => (
  <>
    <Outlet />
  </>
)

export const Route = createFileRoute('/_auth/runs/$run_id/jobs')({
  component: RouteComponent,
  loader: () => {
    return ({
      crumb: 'Jobs',
      includeCrumbLink: true,
      pageTitle: null,
    })
  },
})

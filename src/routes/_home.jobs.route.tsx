import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_home/jobs')({
  component: RouteComponent,

  loader: () => ({
    crumb: 'Jobs',
    includeCrumbLink: true,
  }),
})

function RouteComponent() {
  return <Outlet />
}

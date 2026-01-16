import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/jobs')({
  component: RouteComponent,

  loader: () => ({
    crumb: 'Jobs',
    includeCrumbLink: true,
  }),
})

function RouteComponent() {
  return <Outlet />
}

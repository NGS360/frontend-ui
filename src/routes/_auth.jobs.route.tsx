import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/jobs')({
  component: RouteComponent,

  loader: () => ({
    crumb: 'Jobs',
    includeCrumbLink: true,
  }),
})

function RouteComponent() {
  return <Outlet />
}

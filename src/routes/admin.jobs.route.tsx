import { Outlet, createFileRoute } from '@tanstack/react-router'

export const RouteComponent = () => (
  <>
    <Outlet />
  </>
)

export const Route = createFileRoute('/admin/jobs')({
  component: RouteComponent,
  loader: () => ({
    crumb: 'Jobs',
    includeCrumbLink: true,
  }),
})

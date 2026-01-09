import { Outlet, createFileRoute } from '@tanstack/react-router'

export const RouteComponent = () => (
  <>
    <Outlet />
  </>
)

export const Route = createFileRoute('/admin/cloud-config')({
  component: RouteComponent,
  loader: () => ({
    crumb: 'Cloud Configuration',
    includeCrumbLink: true,
  }),
})

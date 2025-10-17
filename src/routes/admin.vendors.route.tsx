import { Outlet, createFileRoute } from '@tanstack/react-router'

export const RouteComponent = () => (
  <>
    <Outlet />
  </>
)

export const Route = createFileRoute('/admin/vendors')({
  component: RouteComponent,
  loader: () => ({
    crumb: 'Vendors',
    includeCrumbLink: true,
  }),
})


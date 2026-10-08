import { Outlet, createFileRoute } from '@tanstack/react-router'

export const RouteComponent = () => (
  <>
    <Outlet />
  </>
)

export const Route = createFileRoute('/_auth/admin/users')({
  component: RouteComponent,
  loader: () => ({
    crumb: 'Users',
    includeCrumbLink: true,
  }),
})

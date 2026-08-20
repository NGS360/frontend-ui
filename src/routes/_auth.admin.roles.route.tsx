import { Outlet, createFileRoute } from '@tanstack/react-router'

export const RouteComponent = () => (
  <>
    <Outlet />
  </>
)

export const Route = createFileRoute('/_auth/admin/roles')({
  component: RouteComponent,
  loader: () => ({
    crumb: 'Roles',
    includeCrumbLink: true,
  }),
})

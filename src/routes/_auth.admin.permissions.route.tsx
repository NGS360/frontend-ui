import { Outlet, createFileRoute } from '@tanstack/react-router'

export const RouteComponent = () => (
  <>
    <Outlet />
  </>
)

export const Route = createFileRoute('/_auth/admin/permissions')({
  component: RouteComponent,
  loader: () => ({
    crumb: 'Permissions',
    includeCrumbLink: true,
  }),
})

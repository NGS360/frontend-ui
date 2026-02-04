import { Outlet, createFileRoute } from '@tanstack/react-router'

export const RouteComponent = () => (
  <>
    <Outlet />
  </>
)

export const Route = createFileRoute('/_auth/admin/run-settings')({
  component: RouteComponent,
  loader: () => ({
    crumb: 'Run Settings',
    includeCrumbLink: true,
  }),
})

import { Outlet, createFileRoute } from '@tanstack/react-router'

export const RouteComponent = () => (
  <>
    <Outlet />
  </>
)

export const Route = createFileRoute('/_auth/projects/$project_id/settings')({
  component: RouteComponent,
  loader: () => ({
    crumb: 'Settings',
    includeCrumbLink: true,
  }),
})

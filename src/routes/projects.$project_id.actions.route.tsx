import { Outlet, createFileRoute } from '@tanstack/react-router'

export const RouteComponent = () => (
  <>
    <Outlet />
  </>
)

export const Route = createFileRoute('/projects/$project_id/actions')({
  component: RouteComponent,
  loader: () => ({
    crumb: 'Project Actions',
    includeCrumbLink: true,
  }),
})
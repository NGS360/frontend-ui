import { Outlet, createFileRoute } from '@tanstack/react-router'

export const RouteComponent = () => (
  <>
    <Outlet />
  </>
)

export const Route = createFileRoute('/projects/$project_id/overview')({
  component: RouteComponent,
  loader: () => ({
    crumb: 'Overview',
    includeCrumbLink: true,
  }),
})
import { Outlet, createFileRoute } from '@tanstack/react-router'

export const RouteComponent = () => (
  <>
    <Outlet />
  </>
)

export const Route = createFileRoute('/projects/$project_id/ingest')({
  component: RouteComponent,
  loader: () => ({
    crumb: 'Ingest Vendor Data',
    includeCrumbLink: true,
  }),
})
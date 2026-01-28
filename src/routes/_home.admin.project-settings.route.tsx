import { Outlet, createFileRoute } from '@tanstack/react-router'

export const RouteComponent = () => (
  <>
    <Outlet />
  </>
)

export const Route = createFileRoute('/_home/admin/project-settings')({
  component: RouteComponent,
  loader: () => ({
    crumb: 'Project Settings',
    includeCrumbLink: true,
  }),
})

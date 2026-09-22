import { Outlet, createFileRoute } from '@tanstack/react-router'

export const RouteComponent = () => (
  <>
    <Outlet />
  </>
)

export const Route = createFileRoute('/_auth/projects/$project_id/samples')({
  component: RouteComponent,
  loader: () => {
    return ({
      crumb: 'Samples',
      includeCrumbLink: true,
      pageTitle: null,
    })
  },
})

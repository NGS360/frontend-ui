import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/admin/roles/$name')({
  component: RouteComponent,
  loader: ({ params }) => ({
    crumb: params.name,
    includeCrumbLink: false,
  }),
})

function RouteComponent() {
  return <Outlet />
}

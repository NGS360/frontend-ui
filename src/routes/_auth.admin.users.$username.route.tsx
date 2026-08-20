import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/admin/users/$username')({
  component: RouteComponent,
  loader: ({ params }) => ({
    crumb: params.username,
    includeCrumbLink: false,
  }),
})

function RouteComponent() {
  return <Outlet />
}

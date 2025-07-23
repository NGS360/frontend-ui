import { Outlet, createFileRoute } from '@tanstack/react-router'

export const RouteComponent = () => (
  <>
    <div className="flex flex-col ml-8 mr-8 mt-8">
      <Outlet />
    </div>
  </>
)

export const Route = createFileRoute('/projects')({
  component: RouteComponent,
  loader: () => ({
    crumb: 'Projects',
    includeCrumbLink: true,
  }),
})

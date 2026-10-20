import { Outlet, createFileRoute } from '@tanstack/react-router'

export const RouteComponent = () => (
  <>
    <div className="flex flex-col mx-4 @3xl:mx-8 mt-6 @3xl:mt-8">
      <Outlet />
    </div>
  </>
)

export const Route = createFileRoute('/_auth/projects')({
  component: RouteComponent,
  loader: () => ({
    crumb: 'Projects',
    includeCrumbLink: true,
  }),
})

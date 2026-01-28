import { Outlet, createFileRoute } from '@tanstack/react-router'

export const RouteComponent = () => (
  <>
    <div className="flex flex-col ml-8 mr-8 mt-8">
      <Outlet />
    </div>
  </>
)

export const Route = createFileRoute('/_home/runs')({
  component: RouteComponent,
  loader: () => ({
    crumb: 'Illumina Runs',
    includeCrumbLink: true,
  }),
})

import { Outlet, createFileRoute } from '@tanstack/react-router'
import { getJob } from '@/client'

export const Route = createFileRoute('/_auth/jobs/$job_id')({
  component: RouteComponent,
  loader: async ({ params }) => {
    const jobData = await getJob({
      path: { job_id: params.job_id },
      throwOnError: true,
    })
    return ({
      crumb: jobData.data.name,
      includeCrumbLink: false,
      job: jobData.data
    })
  }
})

function RouteComponent() {
  return (
    <div className="flex flex-col ml-8 mr-8 mt-8">
      <Outlet />
    </div>
  )
}

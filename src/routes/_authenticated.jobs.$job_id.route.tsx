import { AxiosError } from 'axios'
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { getJob } from '@/client'

export const Route = createFileRoute('/_authenticated/jobs/$job_id')({
  component: RouteComponent,
  loader: async ({ params }) => {
    const jobData = await getJob({
      path: {
        job_id: params.job_id
      }
    })
    if (jobData.status !== 200 || jobData instanceof AxiosError) {
      alert("An error occurred: " + jobData.error?.detail || "An unknown error occurred.")
      throw redirect({ to: '/admin/jobs' })
    }
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

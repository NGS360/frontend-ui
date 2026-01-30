import { AxiosError } from 'axios'
import { Outlet, createFileRoute, getRouteApi, redirect } from '@tanstack/react-router'
import { getProjectByProjectId } from '@/client'

export const Route = createFileRoute('/_auth/projects/$project_id')({
  component: RouteComponent,
  loader: async ({ params }) => {
    const projectData = await getProjectByProjectId({
      path: {
        project_id: params.project_id
      }
    })
    if (projectData.status !== 200 || projectData instanceof AxiosError) {
      alert("An error occurred: " + projectData.error?.detail || "An unknown error occurred.")
      throw redirect({ to: '/projects' })
    }
    return ({
      crumb: projectData.data.project_id,
      includeCrumbLink: false,
      project: projectData.data
    })
  }
})

function RouteComponent() {
  // Load project data
  const routeApi = getRouteApi('/_auth/projects/$project_id')
  const { project } = routeApi.useLoaderData()

  return (
    <>
      <div className='flex flex-col gap-4'>
        {/* Header */}
        <h1 className='text-3xl font-extralight'>{project.name}</h1>
        {/* Outlet */}
        <Outlet />
      </div>
    </>
  )
}
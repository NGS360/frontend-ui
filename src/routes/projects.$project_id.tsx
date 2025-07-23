import { createFileRoute, redirect } from '@tanstack/react-router'
import { AxiosError } from 'axios'
import { getProjectByProjectId } from '@/client'

export const Route = createFileRoute('/projects/$project_id')({
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
      includeCrumbLink: true,
      project: projectData.data
    })
  }
})

function RouteComponent() {
  const { project } = Route.useLoaderData();

  return <div>{`Welcome to project ${project.project_id}`}</div>
}

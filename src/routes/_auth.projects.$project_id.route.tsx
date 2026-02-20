import { AxiosError } from 'axios'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { getProjectByProjectId } from '@/client'
import { getProjectByProjectIdOptions } from '@/client/@tanstack/react-query.gen'

export const Route = createFileRoute('/_auth/projects/$project_id')({
  component: RouteComponent,
  loader: async ({ params, context }) => {
    const projectData = await getProjectByProjectId({
      path: {
        project_id: params.project_id
      }
    })
    if (projectData.status !== 200 || projectData instanceof AxiosError) {
      alert("An error occurred: " + projectData.error?.detail || "An unknown error occurred.")
      throw redirect({ to: '/projects' })
    }
    
    // Prefetch the query data
    await context.queryClient.prefetchQuery(
      getProjectByProjectIdOptions({
        path: { project_id: params.project_id }
      })
    )
    
    return ({
      crumb: projectData.data.name || projectData.data.project_id,
      includeCrumbLink: false,
    })
  }
})

function RouteComponent() {
  const { project_id } = Route.useParams()
  
  // Use React Query hook instead of loader data for automatic refetching
  const { data: project } = useSuspenseQuery(
    getProjectByProjectIdOptions({
      path: { project_id }
    })
  )

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
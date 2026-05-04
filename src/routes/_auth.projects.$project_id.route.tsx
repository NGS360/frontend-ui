import { useSuspenseQuery } from '@tanstack/react-query'
import { Outlet, createFileRoute } from '@tanstack/react-router'
import { getProjectByProjectId } from '@/client'
import { getProjectByProjectIdOptions } from '@/client/@tanstack/react-query.gen'

export const Route = createFileRoute('/_auth/projects/$project_id')({
  component: RouteComponent,
  loader: async ({ params, context }) => {
    const projectData = await getProjectByProjectId({
      path: { project_id: params.project_id },
      throwOnError: true,
    })

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
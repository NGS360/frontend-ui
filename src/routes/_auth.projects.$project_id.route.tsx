import { useSuspenseQuery } from '@tanstack/react-query'
import { Calendar, Clock, User } from 'lucide-react'
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

  const isEpoch = (dateStr: string) => dateStr.startsWith('1970-01-01')
  const hasCreator = project.created_by && project.created_by !== 'unknown'
  const hasCreatedAt = !isEpoch(project.created_at)
  const hasLastModified = !isEpoch(project.last_modified)

  const createdAt = hasCreatedAt ? new Date(project.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  }) : null
  const lastModified = hasLastModified ? new Date(project.last_modified).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  }) : null

  const showMetadata = hasCreator || hasCreatedAt || hasLastModified

  return (
    <>
      <div className='flex flex-col gap-4'>
        {/* Header */}
        <div>
          <h1 className='text-3xl font-extralight'>{project.name}</h1>
          {showMetadata && (
            <div className='flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-3 mt-1 text-sm text-muted-foreground'>
              {hasCreator && <span className='inline-flex items-center gap-1'><User size={14} />Created by <span className='font-semibold'>{project.created_by}</span></span>}
              {hasCreatedAt && <span className='inline-flex items-center gap-1'><Calendar size={14} />Created on <span className='font-semibold'>{createdAt}</span></span>}
              {hasLastModified && <span className='inline-flex items-center gap-1'><Clock size={14} />Modified <span className='font-semibold'>{lastModified}</span></span>}
            </div>
          )}
        </div>
        {/* Outlet */}
        <Outlet />
      </div>
    </>
  )
}
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

  // These timestamps are nullable, and an unset one arrives as the epoch —
  // neither is worth showing.
  const isEpoch = (dateStr: string) => dateStr.startsWith('1970-01-01')
  const formatDate = (dateStr: string | null | undefined) =>
    dateStr && !isEpoch(dateStr)
      ? new Date(dateStr).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        })
      : null

  const hasCreator = project.created_by && project.created_by !== 'unknown'
  const createdAt = formatDate(project.created_at)
  const lastModified = formatDate(project.last_modified)

  const showMetadata = hasCreator || createdAt || lastModified

  return (
    <>
      <div className='flex flex-col gap-4'>
        {/* Header */}
        <div>
          <h1 className='text-3xl font-extralight'>{project.name}</h1>
          {showMetadata && (
            <div className='flex flex-col @2xl:flex-row @2xl:flex-wrap gap-1 @2xl:gap-3 mt-1 text-sm text-muted-foreground'>
              {hasCreator && <span className='inline-flex items-center gap-1'><User size={14} />Created by <span className='font-semibold'>{project.created_by}</span></span>}
              {createdAt && <span className='inline-flex items-center gap-1'><Calendar size={14} />Created on <span className='font-semibold'>{createdAt}</span></span>}
              {lastModified && <span className='inline-flex items-center gap-1'><Clock size={14} />Modified <span className='font-semibold'>{lastModified}</span></span>}
            </div>
          )}
        </div>
        {/* Outlet */}
        <Outlet />
      </div>
    </>
  )
}
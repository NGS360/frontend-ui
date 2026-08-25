import { useSuspenseQuery } from '@tanstack/react-query'
import { Calendar, Clock, SlidersHorizontal, User } from 'lucide-react'
import { Link, Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'
import { getProjectByProjectId } from '@/client'
import { getProjectByProjectIdOptions } from '@/client/@tanstack/react-query.gen'
import { Button } from '@/components/ui/button'
import { useProjectAccess } from '@/hooks/use-project-access'
import { PERMISSIONS } from '@/lib/permissions'

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
  // Matched against the route id rather than the pathname: a trailing slash or
  // a future /settings/<subpage> must not change the answer.
  const onSettings = useRouterState({
    select: (state) =>
      state.matches.some((match) =>
        match.routeId.startsWith('/_auth/projects/$project_id/settings'),
      ),
  })
  
  // Use React Query hook instead of loader data for automatic refetching
  const { data: project } = useSuspenseQuery(
    getProjectByProjectIdOptions({
      path: { project_id }
    })
  )
  // Project-scoped, so the answer comes from the project's own permissions
  // rather than from useMyAccess. See hooks/use-project-access.ts.
  const { can } = useProjectAccess(project)
  const canManageMembers = can(PERMISSIONS.PROJECT_MANAGE_MEMBERS)

  // Two shapes mean "no usable date" and both must be treated the same. The API
  // sends null when MySQL handed it a zero-date it could not parse (see
  // ProjectPublic._nullify_invalid_datetime), and 1970-01-01 when a row carries
  // the epoch as a placeholder. Format only what is real, and let the absence of
  // a formatted string drive the rendering.
  const formatDate = (dateStr: string | null) =>
    dateStr && !dateStr.startsWith('1970-01-01')
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
        {/* Header. items-end so the settings control sits level with the
            metadata line rather than floating beside the title. */}
        <div className='flex items-end justify-between gap-4'>
          <div className='min-w-0'>
            <h1 className='text-3xl font-extralight'>{project.name}</h1>
            {showMetadata && (
              <div className='flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-3 mt-1 text-sm text-muted-foreground'>
                {hasCreator && <span className='inline-flex items-center gap-1'><User size={14} />Created by <span className='font-semibold'>{project.created_by}</span></span>}
                {createdAt && <span className='inline-flex items-center gap-1'><Calendar size={14} />Created on <span className='font-semibold'>{createdAt}</span></span>}
                {lastModified && <span className='inline-flex items-center gap-1'><Clock size={14} />Modified <span className='font-semibold'>{lastModified}</span></span>}
              </div>
            )}
          </div>
          {/* Suppressed on the settings page, which carries its own way back, and
              for anyone who cannot manage membership -- the only thing behind
              it. Membership is project-scoped, so the answer comes from the
              project rather than from useMyAccess. */}
          {!onSettings && canManageMembers && (
            <Button
              id='project-settings-link'
              variant='outline'
              className='shrink-0'
              asChild
            >
              <Link to='/projects/$project_id/settings' params={{ project_id }}>
                <SlidersHorizontal className='h-4 w-4' />
                {/* Icon-only below sm: the label is the first thing worth
                    dropping when the title needs the width. */}
                <span className='hidden sm:inline'>Project Settings</span>
                <span className='sr-only sm:hidden'>Project Settings</span>
              </Link>
            </Button>
          )}
        </div>
        {/* Outlet */}
        <Outlet />
      </div>
    </>
  )
}
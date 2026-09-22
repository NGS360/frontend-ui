import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { ProjectJobsTable } from '@/components/project-jobs-table'

export const Route = createFileRoute('/_auth/projects/$project_id/jobs/')({
  component: RouteComponent,
})

function RouteComponent() {
  const routeApi = getRouteApi('/_auth/projects/$project_id/jobs/')
  const { project_id } = routeApi.useParams()

  // No count in a heading here: the tab is the label, and the table already
  // reports its own total in the pagination footer.
  return (
    <div className='animate-fade-in-up pt-4'>
      <ProjectJobsTable projectId={project_id} />
    </div>
  )
}

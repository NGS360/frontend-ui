import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { JobsTable } from '@/components/jobs-table'

export const Route = createFileRoute('/_auth/runs/$run_id/jobs/')({
  component: RouteComponent,
})

function RouteComponent() {
  const routeApi = getRouteApi('/_auth/runs/$run_id/jobs/')
  const { run_id } = routeApi.useParams()

  // No count in a heading here: the tab is the label, and the table already
  // reports its own total in the pagination footer.
  return (
    <div className='pt-4'>
      <JobsTable
        runId={run_id}
        notFoundComponent='No jobs have been submitted for this run.'
      />
    </div>
  )
}

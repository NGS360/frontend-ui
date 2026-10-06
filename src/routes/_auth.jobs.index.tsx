import { createFileRoute, useNavigate } from '@tanstack/react-router'
import z from 'zod'
import { JobsTable } from '@/components/jobs-table'
import { useCurrentUser } from '@/hooks/use-current-user'

// Only the search term is persisted, matching the projects and runs lists.
// Paging and sorting stay local, as they were before.
const jobsSearchSchema = z.object({
  query: z.string().optional().default(''),
})

export const Route = createFileRoute('/_auth/jobs/')({
  component: RouteComponent,
  validateSearch: jobsSearchSchema,
})

function RouteComponent() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const { data: user } = useCurrentUser()

  const username = user?.username || 'system'

  return (
    <div className='flex flex-col gap-6 mx-4 @3xl:mx-8 mt-6 @3xl:mt-8 pb-8'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-3xl'>Jobs</h1>
        <p className='text-muted-foreground'>
          View and manage your submitted jobs.
        </p>
      </div>

      <JobsTable
        user={username}
        // Every row is this user's, so a column of one repeated name earns nothing.
        userColumn={false}
        fullscreenLoading
        initialSearch={search.query}
        onSearchCommit={(query) => {
          navigate({ to: '/jobs', search: { query }, replace: true })
        }}
        notFoundComponent={`No jobs found for user: ${username}`}
      />
    </div>
  )
}

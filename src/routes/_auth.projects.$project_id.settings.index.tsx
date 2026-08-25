import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { ProjectMembersCard } from '@/components/project-members-card'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_auth/projects/$project_id/settings/')({
  component: RouteComponent,
})

/**
 * Per-project settings.
 *
 * Membership was a card on the project page, which spent permanent vertical
 * space on something most viewers never touch — and cost every one of them the
 * request behind it. It lives here instead, one click from the title.
 */
function RouteComponent() {
  const { project_id } = Route.useParams()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-light">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Who can see and change this project.
          </p>
        </div>
        <Button variant="secondary" className="w-full md:w-auto" asChild>
          <Link to="/projects/$project_id" params={{ project_id }}>
            <ArrowLeft className="h-4 w-4" />
            Back to project
          </Link>
        </Button>
      </div>

      <ProjectMembersCard projectId={project_id} />
    </div>
  )
}

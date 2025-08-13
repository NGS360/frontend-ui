import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/projects/$project_id/files/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/$project_id/files"!</div>
}

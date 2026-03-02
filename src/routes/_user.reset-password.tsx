import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_user/reset-password')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_user/reset-password"!</div>
}

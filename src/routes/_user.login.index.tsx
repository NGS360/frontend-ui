import { createFileRoute } from '@tanstack/react-router'
import { LoginForm } from '@/components/login-form'

export const Route = createFileRoute('/_user/login/')({
  component: RouteComponent,
})

function RouteComponent() {
  const redirect = new URLSearchParams(window.location.search).get('redirect') ?? undefined
  return (
    <div id="login-route-page">
      <LoginForm redirectTo={redirect} />
    </div>
  )
}

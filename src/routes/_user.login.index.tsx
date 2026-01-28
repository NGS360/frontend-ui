import { createFileRoute } from '@tanstack/react-router'
import { LoginForm } from '@/components/login-form'

export const Route = createFileRoute('/_user/login/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <LoginForm />
}

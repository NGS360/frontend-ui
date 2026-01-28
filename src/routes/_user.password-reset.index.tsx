import { createFileRoute } from '@tanstack/react-router'
import { PasswordResetForm } from '@/components/password-reset-form'

export const Route = createFileRoute('/_user/password-reset/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <PasswordResetForm />
}

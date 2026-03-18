import { createFileRoute, redirect } from '@tanstack/react-router'
import { LoginForm } from '@/components/login-form'

type LoginSearch = {
  redirect?: string
}

export const Route = createFileRoute('/_user/login/')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: (search.redirect as string) || undefined,
  }),
  // Redirect authenticated users away from the login page.
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: search.redirect || '/' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { redirect: redirectTo } = Route.useSearch()
  return (
    <div id="login-route-page">
      <LoginForm redirectTo={redirectTo} />
    </div>
  )
}

import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import Header from '../components/Header'

import { BreadcrumbNav } from '@/components/breadcrumb-nav.tsx'
import { Toaster } from '@/components/ui/sonner.tsx'
import { useAuth } from '@/context/auth-context'
import { currentUserQueryOptions } from '@/hooks/use-current-user'

export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(currentUserQueryOptions())
    return { crumb: 'Home', includeCrumbLink: true }
  },
  component: AuthLayout,
})

function AuthLayout() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) return null

  return (
    <>
      <Header />
      <div className="ml-8 mt-4">
        <BreadcrumbNav />
      </div>
      <Outlet />
      <Toaster />
    </>
  )
}

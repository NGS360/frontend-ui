import { Outlet, createFileRoute, redirect, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'

import Header from '../components/Header'

import { BreadcrumbNav } from '@/components/breadcrumb-nav.tsx'
import { Toaster } from '@/components/ui/sonner.tsx'
import { useAuth } from '@/context/auth-context'

export const Route = createFileRoute('/_auth')({
  // Handles the initial navigation: redirects to login before any child route loads.
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
  },
  component: AuthLayout,
  loader: () => ({
    crumb: 'Home',
    includeCrumbLink: true,
  }),
})

function AuthLayout() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  // Get the current URL so we can redirect back after re-login
  const location = useRouterState({ select: (s) => s.location })

  // Handles mid-session logout: when isAuthenticated flips to false (token
  // cleared, session expired, etc.) React re-renders this component and the
  // effect fires the redirect — no router.invalidate() needed.
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/login', search: { redirect: location.href }, replace: true })
    }
  }, [isAuthenticated])

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

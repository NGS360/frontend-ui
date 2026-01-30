import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import Header from '../components/Header'

import { BreadcrumbNav } from '@/components/breadcrumb-nav.tsx'
import { Toaster } from '@/components/ui/sonner.tsx'

export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          // Save current location for redirect after login
          redirect: location.href,
        },
      })
    }
  },
  component: () => (
    <>
      <Header />
      <div className="ml-8 mt-4">
        <BreadcrumbNav />
      </div>
      <Outlet />
      <Toaster />
    </>
  ),
  loader: () => ({
    crumb: 'Home',
    includeCrumbLink: true,
  }),
})

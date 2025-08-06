import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import Header from '../components/Header'

import TanStackQueryLayout from '../integrations/tanstack-query/layout.tsx'

import type { QueryClient } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner.tsx'
import { BreadcrumbNav } from '@/components/breadcrumb-nav.tsx'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <>
      <Header />
      <div className='ml-8 mt-4'>
        <BreadcrumbNav />
      </div>
      <Outlet />
      <Toaster />
      <TanStackRouterDevtools />
      <TanStackQueryLayout />
    </>
  ),
  loader: () => ({
    crumb: 'Home',
    includeCrumbLink: true,
  }),
})

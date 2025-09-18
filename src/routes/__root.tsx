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
      {/* Set max width for all page content & center */}
      <div className='max-w-[80rem] mx-auto'> 
        <div className='ml-8 mt-4'>
          <BreadcrumbNav />
        </div>
        <Outlet />
      </div>
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

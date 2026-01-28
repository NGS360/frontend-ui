import { Outlet, createFileRoute } from '@tanstack/react-router'

import Header from '../components/Header'

import { Toaster } from '@/components/ui/sonner.tsx'
import { BreadcrumbNav } from '@/components/breadcrumb-nav.tsx'

export const Route = createFileRoute('/_home')({
  component: () => (
    <>
      <Header />
      <div className='ml-8 mt-4'>
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

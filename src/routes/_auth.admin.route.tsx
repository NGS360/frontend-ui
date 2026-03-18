import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { AdminSidebar } from '@/components/admin-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { currentUserQueryOptions } from '@/hooks/use-current-user'

export const RouteComponent = () => (
  <SidebarProvider>
    <div className="flex flex-col md:flex-row w-full gap-4 pl-4 pt-4">
      <aside className="md:sticky md:top-14 md:self-start overflow-y-auto md:min-w-64 lg:min-w-72 md:max-w-64 lg:max-w-72 rounded-md flex-shrink-0">
        <AdminSidebar />
      </aside>
      <main className="flex-1 min-h-screen min-w-0 pr-4 pt-4">
        <Outlet />
      </main>
    </div>
  </SidebarProvider>
)

export const Route = createFileRoute('/_auth/admin')({
  beforeLoad: async ({ context }) => {
    // Parent _auth loader already cached the user — read from query cache
    const user = await context.queryClient.ensureQueryData(currentUserQueryOptions())
    if (!user.is_superuser) {
      throw redirect({
        to: '/access-denied',
      })
    }
  },
  component: RouteComponent,
  loader: () => ({
    crumb: 'Admin',
    includeCrumbLink: true,
  }),
})

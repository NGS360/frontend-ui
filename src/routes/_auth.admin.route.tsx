import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { AdminSidebar } from '@/components/admin-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { hasAnyPermission, myAccessQueryOptions } from '@/hooks/use-my-access'
import { ADMIN_SECTION_PERMISSIONS } from '@/lib/permissions'

export const RouteComponent = () => (
  <SidebarProvider className="@container min-w-0">
    <div className="flex flex-col @3xl:flex-row w-full min-w-0 gap-4 pl-4 pt-4">
      <aside className="@3xl:sticky @3xl:top-14 @3xl:self-start overflow-y-auto @3xl:min-w-64 @5xl:min-w-72 @3xl:max-w-64 @5xl:max-w-72 rounded-md flex-shrink-0">
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
    // Permission-based rather than is_superuser-only: the RBAC model has real
    // administrative roles now, and an `admin` or `auditor` role holder who is
    // not flagged as a superuser was previously bounced from a panel they are
    // entitled to. Superuser still passes, implicitly, because it
    // short-circuits every check on the server too.
    //
    // Any one admin-section permission gets you through the door; each section
    // checks its own, and the sidebar only lists the ones you hold.
    const access = await context.queryClient.ensureQueryData(myAccessQueryOptions())
    if (!hasAnyPermission(access, ...ADMIN_SECTION_PERMISSIONS)) {
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

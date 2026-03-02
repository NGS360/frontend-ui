import { Database, Folder, Handshake, LayoutDashboard, ListChecks } from "lucide-react"
import { Link, useRouterState } from "@tanstack/react-router"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export const AdminSidebar = () => {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const menuItems = [
    { title: "Admin Dashboard", icon: LayoutDashboard, url: "/admin" },
    { title: "Vendors", icon: Handshake, url: "/admin/vendors" },
    { title: "Project Settings", icon: Folder, url: "/admin/project-settings" },
    { title: "Illumina Run Settings", icon: Database, url: "/admin/run-settings" },
    { title: "Jobs", icon: ListChecks, url: "/admin/jobs" },
  ]

  return (
    <Sidebar id="admin-sidebar" variant="inset" collapsible="none" className="w-full md:w-auto">
      <SidebarHeader id="admin-sidebar-header" className="p-4">
        <h2 id="admin-sidebar-title" className="text-lg">Admin Panel</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel id="admin-sidebar-nav-label">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu id="admin-sidebar-menu" className="md:space-y-1">
              {menuItems.map((item) => {
                const isActive = currentPath === item.url
                const itemId = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="w-full" isActive={isActive}>
                      <Link id={`admin-sidebar-link-${itemId}`} to={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter id="admin-sidebar-footer" className="p-4">
        <p id="admin-sidebar-version" className="text-xs text-muted-foreground">NGS360 v1.0</p>
      </SidebarFooter>
    </Sidebar>
  )
}
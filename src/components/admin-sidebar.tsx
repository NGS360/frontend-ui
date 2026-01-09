import { Cloud, Cog, Database, Folder, Handshake, LayoutDashboard } from "lucide-react"
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
    { title: "Cloud Configuration", icon: Cloud, url: "/admin/cloud-config" },
  ]

  return (
    <Sidebar variant="inset" collapsible="none" className="w-full md:w-auto">
      <SidebarHeader className="p-4">
        <h2 className="text-lg">Admin Panel</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="md:space-y-1">
              {menuItems.map((item) => {
                const isActive = currentPath === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="w-full" isActive={isActive}>
                      <Link to={item.url}>
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
      <SidebarFooter className="p-4">
        <p className="text-xs text-muted-foreground">NGS360 v1.0</p>
      </SidebarFooter>
    </Sidebar>
  )
}
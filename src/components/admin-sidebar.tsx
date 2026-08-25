import { Database, Folder, Handshake, KeyRound, LayoutDashboard, ListChecks, ShieldCheck, Users } from "lucide-react"
import { Link, useRouterState } from "@tanstack/react-router"
import type { PermissionName } from "@/lib/permissions"
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
import { useMyAccess } from "@/hooks/use-my-access"
import { PERMISSIONS } from "@/lib/permissions"

interface MenuItem {
  title: string
  icon: typeof LayoutDashboard
  url: string
  /** Hidden unless the caller holds this. Omitted means always shown. */
  permission?: PermissionName
}

interface MenuGroup {
  label: string
  items: Array<MenuItem>
}

export const AdminSidebar = () => {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const { can } = useMyAccess()

  // Access management is its own group rather than more entries under
  // Navigation: it is the one part of this panel that changes what other people
  // can do, which is worth separating visually from configuration.
  const groups: Array<MenuGroup> = [
    {
      label: "Navigation",
      items: [
        { title: "Admin Dashboard", icon: LayoutDashboard, url: "/admin" },
        { title: "Vendors", icon: Handshake, url: "/admin/vendors", permission: PERMISSIONS.VENDOR_CREATE },
        { title: "Project Settings", icon: Folder, url: "/admin/project-settings", permission: PERMISSIONS.SETTING_UPDATE },
        { title: "Sequencing Run Settings", icon: Database, url: "/admin/run-settings", permission: PERMISSIONS.SETTING_UPDATE },
        { title: "Jobs", icon: ListChecks, url: "/admin/jobs", permission: PERMISSIONS.JOB_READ_ALL },
      ],
    },
    {
      label: "Access",
      items: [
        { title: "Users", icon: Users, url: "/admin/users", permission: PERMISSIONS.ROLE_READ },
        { title: "Roles", icon: ShieldCheck, url: "/admin/roles", permission: PERMISSIONS.ROLE_READ },
        { title: "Permissions", icon: KeyRound, url: "/admin/permissions", permission: PERMISSIONS.ROLE_READ },
      ],
    },
  ]

  return (
    <Sidebar id="admin-sidebar" variant="inset" collapsible="none" className="w-full md:w-auto">
      <SidebarHeader id="admin-sidebar-header" className="p-4">
        <h2 id="admin-sidebar-title" className="text-lg">Admin Panel</h2>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => {
          // Hidden, not disabled: a control you cannot use is noise, and one
          // that looks usable and then 403s is worse than absent.
          const visible = group.items.filter((item) => !item.permission || can(item.permission))
          if (visible.length === 0) return null
          const groupId = group.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')

          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel id={`admin-sidebar-${groupId}-label`}>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu id={`admin-sidebar-${groupId}-menu`} className="md:space-y-1">
                  {visible.map((item) => {
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
          )
        })}
      </SidebarContent>
      <SidebarFooter id="admin-sidebar-footer" className="p-4">
        <p id="admin-sidebar-version" className="text-xs text-muted-foreground">NGS360 v1.0</p>
      </SidebarFooter>
    </Sidebar>
  )
}

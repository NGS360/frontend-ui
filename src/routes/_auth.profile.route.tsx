import { Outlet, createFileRoute, useLocation, useNavigate } from '@tanstack/react-router'
import { ListChecks, Mail, Settings, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider } from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getGravatarUrl } from '@/lib/utils'
import { useAuth } from '@/context/auth-context'

export const Route = createFileRoute('/_auth/profile')({
  component: RouteComponent,
  loader: () => ({
    crumb: 'Profile',
    includeCrumbLink: false,
  }),
})

function RouteComponent() {
  const { user } = useAuth()
  const userEmail = user?.email || ''
  const avatarUrl = getGravatarUrl(userEmail)
  const [activeSection, setActiveSection] = useState('user-info')
  const location = useLocation()
  const navigate = useNavigate()

  const menuItems = [
    { id: 'user-info', title: 'Account Info', icon: User },
    { id: 'jobs', title: 'Jobs', icon: ListChecks },
    { id: 'settings', title: 'Settings', icon: Settings },
  ]

  // Handle hash navigation on mount and location changes
  useEffect(() => {
    const hash = location.hash.replace('#', '')
    if (hash && menuItems.some(item => item.id === hash)) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        scrollToSection(hash)
      }, 100)
    }
  }, [location.hash])

  useEffect(() => {
    const handleScroll = () => {
      const sections = menuItems.map(item => document.getElementById(item.id))
      const scrollPosition = window.scrollY + 100

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i]
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(menuItems[i].id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    navigate({ to: '/profile', hash: sectionId })
    setActiveSection(sectionId)
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 70
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      })
    }
  }

  return (
    <SidebarProvider>
      <div className="flex flex-col md:flex-row w-full gap-4 ml-8 mr-8 mt-8">
        <aside className="md:sticky md:top-14 md:self-start overflow-y-auto md:min-w-64 lg:min-w-72 md:max-w-64 lg:max-w-72 rounded-md flex-shrink-0 md:max-h-[calc(100vh-4rem)]">
          <div className="flex flex-col gap-6">
            {/* Profile Section */}
            <div className="flex flex-col gap-6 pt-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl} alt={userEmail} />
                  <AvatarFallback className="text-2xl">
                    {userEmail.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold">{user?.full_name || 'User'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {user?.username || ''}
                  </p>
                </div>
              </div>

              {/* User Details */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Email</span>
                    <span className="text-sm text-muted-foreground">{userEmail}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Role</span>
                    <span className="text-sm text-muted-foreground">
                      {user?.is_superuser ? 'Administrator' : 'User'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <Sidebar variant="inset" collapsible="none" className="w-full md:w-auto border-0 bg-transparent">
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu className="md:space-y-1">
                      {menuItems.map((item) => (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton 
                            className="w-full cursor-pointer" 
                            isActive={activeSection === item.id}
                            onClick={() => scrollToSection(item.id)}
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.title}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>
          </div>
        </aside>
        <main className="flex-1 min-h-screen min-w-0 pr-4 pt-4">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  )
}

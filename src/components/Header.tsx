import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { BookOpen, ChevronDown, MenuIcon, ShieldCheck, Sparkles, XIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'
import { CreateProjectForm } from './create-project-form'
import { SearchBar } from './search-bar'
import { NotificationsDropdown } from './notifications-dropdown'
import { UserAvatar } from './user-avatar'
import { NGS360Logo } from '@/components/ngs360-logo'
import { useAuth } from '@/context/auth-context'
import { entityIcons } from '@/lib/entity-icons'
import { NGS360_LETTER_COLORS } from '@/lib/ngs360-brand'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSidebar } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type NavItemType = {
  to: string
  label: string
  icon?: React.ReactNode
  search?: {}
  isExternal?: boolean
}

export default function Header() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { open: aiSidebarOpen, openMobile: aiSidebarOpenMobile, isMobile: isMobileViewport, toggleSidebar } = useSidebar()
  const aiActive = isMobileViewport ? aiSidebarOpenMobile : aiSidebarOpen
  const [menuOpen, setMenuOpen] = useState(false)
  const [condensedNavOpen, setCondensedNavOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  // The hamburger menu content is rendered in a portal, so container queries
  // on the header can't reach it — track the width in JS instead.
  const [headerWidth, setHeaderWidth] = useState(0)
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setHeaderWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  // matches the @2xl container breakpoint (42rem) where the header search is shown
  const searchInHeader = headerWidth >= 672

  // Cycle the AI icon through the NGS360 letter colors once per second while the
  // sidebar is closed (button unclicked). Pauses when active.
  const [aiColorIndex, setAiColorIndex] = useState(0)
  useEffect(() => {
    if (aiActive) return
    const id = setInterval(() => {
      setAiColorIndex((i) => (i + 1) % NGS360_LETTER_COLORS.length)
    }, 1000)
    return () => clearInterval(id)
  }, [aiActive])

  const apiDocsUrl = `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/docs`

  const navItems: Array<NavItemType> = [
    { to: '/runs', label: 'Sequencing Runs', icon: <entityIcons.run className="inline mr-1" /> },
    { to: '/projects', label: 'Projects', icon: <entityIcons.project className="inline mr-1" />, search: {sort_by: undefined, sort_order: undefined} },
    { to: '/admin', label: 'Admin', icon: <ShieldCheck className="inline mr-1" /> },
    { to: apiDocsUrl, label: 'API Docs', icon: <BookOpen className="inline mr-1" />, isExternal: true }
  ]

  const navId = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const { pathname } = useLocation()
  const currentNavItem = navItems.find(
    ({ to, isExternal }) => !isExternal && (pathname === to || pathname.startsWith(`${to}/`))
  )

  return (
    <header ref={headerRef} id="app-header" className="@container sticky top-0 left-0 w-full h-14 flex items-center gap-3 shadow-md bg-semi-transparent backdrop-blur-sm z-10">
      {/* Logo and Nav Items - Left Side */}
      <div id="header-left" className="flex items-center">
        {/* Logo */}
        <div
          id="header-logo"
          className="pl-2 cursor-pointer"
          onClick={() => navigate({ to: '/' })}
        >
          <NGS360Logo iconSize="size-[35px]" textSize="text-xl" gap="gap-2" className="p-2" />
        </div>

        {/* Desktop Nav Items */}
        <div id="header-nav-desktop" className="hidden @7xl:block ml-4">
          <NavigationMenu>
            <NavigationMenuList className="gap-4">
              {navItems.map(({ to, label, icon, search, isExternal }) => (
                <NavigationMenuItem key={to}>
                  <NavigationMenuLink asChild>
                    {isExternal ? (
                      <a id={`header-nav-${navId(label)}`} href={to} target="_blank" rel="noopener noreferrer">
                        <div className='flex items-center gap-1'>
                          {icon}
                          {label}
                        </div>
                      </a>
                    ) : (
                      <Link id={`header-nav-${navId(label)}`} to={to} search={search}>
                        <div className='flex items-center gap-1'>
                          {icon}
                          {label}
                        </div>
                      </Link>
                    )}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Condensed Nav Dropdown - intermediate width */}
        <div id="header-nav-condensed" className="hidden @4xl:block @7xl:hidden ml-4">
          <DropdownMenu open={condensedNavOpen} onOpenChange={setCondensedNavOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                id="header-nav-condensed-toggle"
                variant="ghost"
                aria-label="Navigation menu"
              >
                {currentNavItem ? (
                  <div className='flex items-center gap-1'>
                    {currentNavItem.icon}
                    {currentNavItem.label}
                  </div>
                ) : (
                  'Menu'
                )}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent id="header-nav-condensed-menu" align="start" sideOffset={4}>
              {navItems.map(({ to, label, icon, search, isExternal }) => (
                <DropdownMenuItem asChild key={to}>
                  {isExternal ? (
                    <a id={`header-condensed-nav-${navId(label)}`} href={to} target="_blank" rel="noopener noreferrer" onClick={() => setCondensedNavOpen(false)}>
                      <div className='flex items-center gap-1'>
                        {icon}
                        {label}
                      </div>
                    </a>
                  ) : (
                    <Link id={`header-condensed-nav-${navId(label)}`} to={to} search={search} onClick={() => setCondensedNavOpen(false)}>
                      <div className='flex items-center gap-1'>
                        {icon}
                        {label}
                      </div>
                    </Link>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search bar and Create Button - Right Side */}
      <div id="header-right" className="flex flex-1 items-center justify-end gap-3 ml-auto pr-2">
        {/* Search bar - narrower version for header */}
        <div id="header-search" className="hidden @2xl:block flex-1 min-w-0">
          <SearchBar idPrefix="header-search" />
        </div>

        {/* Desktop Create Button */}
        <div id="header-create-project" className="hidden @4xl:block">
          <CreateProjectForm
            idPrefix="header-create-project"
            trigger={(
              <Button id="header-create-project-button">Create Project</Button>
            )}
          />
        </div>

        {/* Notifications Dropdown - Only show when authenticated */}
        {isAuthenticated && (
          <div id="header-notifications">
            <NotificationsDropdown />
          </div>
        )}

        {/* AI Assistant sidebar toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              id="header-ai-button"
              variant="ghost"
              size="icon"
              aria-label="AI Assistant"
              aria-pressed={aiActive}
              data-active={aiActive}
              className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
              onClick={toggleSidebar}
            >
              <Sparkles
                className="h-5 w-5 transition-colors duration-500"
                style={aiActive ? undefined : { color: NGS360_LETTER_COLORS[aiColorIndex] }}
              />
              <span className="sr-only">AI Assistant</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{aiActive ? 'Close AI Assistant' : 'Open AI Assistant'}</TooltipContent>
        </Tooltip>

        {/* Avatar or Sign In */}
        <div id="header-user-actions">
          {isAuthenticated ? (
            <UserAvatar />
          ) : (
            <Link id="header-sign-in-link" to="/login">
              <Button id="header-sign-in-button" variant="outline">
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              id="header-mobile-menu-toggle"
              variant="outline"
              className="@4xl:hidden"
              aria-label="Toggle navigation"
            >
              {menuOpen ? (
                <XIcon className="h-6 w-6 text-foreground" />
              ) : (
                <MenuIcon className="h-6 w-6 text-foreground" />
              )}
            </Button>
          </DropdownMenuTrigger>

          {/* Mobile menu (using DropdownMenu) */}
          <DropdownMenuContent
            id="header-mobile-menu"
            align="end"
            sideOffset={4}
            collisionBoundary={headerRef.current}
            className="w-(--radix-dropdown-menu-content-available-width) max-h-[calc(100svh-4.5rem)] flex flex-col gap-2"
          >
            {navItems.map(({ to, label, icon, search, isExternal }) => (
              <DropdownMenuItem asChild key={to} className='w-full justify-center'>
                {isExternal ? (
                  <a id={`header-mobile-nav-${navId(label)}`} href={to} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>
                    <div className='flex items-center gap-1'>
                      {icon}
                      {label}
                    </div>
                  </a>
                ) : (
                  <Link id={`header-mobile-nav-${navId(label)}`} to={to} search={search} onClick={() => setMenuOpen(false)}>
                    <div className='flex items-center gap-1'>
                      {icon}
                      {label}
                    </div>
                  </Link>
                )}
              </DropdownMenuItem>
            ))}
            {!searchInHeader && (
              <div id="header-mobile-search" className="px-2 py-2">
                <SearchBar idPrefix="header-mobile-search" onResultClick={() => setMenuOpen(false)} />
              </div>
            )}
            <DropdownMenuItem asChild>
              <CreateProjectForm
                idPrefix="header-mobile-create-project"
                trigger={(
                  <Button id="header-mobile-create-project-button" className='w-full'>Create ProjectID</Button>
                )}
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

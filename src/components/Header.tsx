import { Link, useNavigate } from '@tanstack/react-router'
import { BookOpen, Database, Folder, MenuIcon, ShieldCheck, XIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from './ui/button'
import { CreateProjectForm } from './create-project-form'
import { SearchBar } from './search-bar'
import { NotificationsDropdown } from './notifications-dropdown'
import { UserAvatar } from './user-avatar'
import { NGS360Logo } from '@/components/ngs360-logo'
import { useAuth } from '@/context/auth-context'
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
  const [menuOpen, setMenuOpen] = useState(false)

  const apiDocsUrl = `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/docs`

  const navItems: Array<NavItemType> = [
    { to: '/runs', label: 'Illumina Runs', icon: <Database className="inline mr-1" /> },
    { to: '/projects', label: 'Projects', icon: <Folder className="inline mr-1" />, search: {sort_by: undefined, sort_order: undefined} },
    { to: '/admin', label: 'Admin', icon: <ShieldCheck className="inline mr-1" /> },
    { to: apiDocsUrl, label: 'API Docs', icon: <BookOpen className="inline mr-1" />, isExternal: true }
  ]

  const navId = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  return (
    <header id="app-header" className="sticky top-0 left-0 w-full flex items-center shadow-md bg-semi-transparent backdrop-blur-sm z-10">
      {/* Logo and Nav Items - Left Side */}
      <div id="header-left" className="flex items-center">
        {/* Logo */}
        <div
          id="header-logo"
          className="pl-2 cursor-pointer"
          onClick={() => navigate({ to: '/' })}
        >
          <NGS360Logo iconSize="max-w-[35px]" textSize="text-xl" gap="gap-2" className="p-2" />
        </div>

        {/* Desktop Nav Items */}
        <div id="header-nav-desktop" className="hidden xl:block ml-4">
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
      </div>

      {/* Search bar and Create Button - Right Side */}
      <div id="header-right" className="flex items-center gap-3 ml-auto pr-2">
        {/* Search bar - narrower version for header */}
        <div id="header-search" className="hidden xl:block w-64 xl:w-80">
          <SearchBar idPrefix="header-search" />
        </div>

        {/* Desktop Create Button */}
        <div id="header-create-project" className="hidden xl:block">
          <CreateProjectForm
            idPrefix="header-create-project"
            trigger={(
              <Button id="header-create-project-button">Create Project</Button>
            )}
          />
        </div>

        {/* Notifications Dropdown - Only show when authenticated */}
        {isAuthenticated && (
          <div id="header-notifications" className="hidden xl:block">
            <NotificationsDropdown />
          </div>
        )}

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
              className="xl:hidden"
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
          <DropdownMenuContent id="header-mobile-menu" align="end" sideOffset={4} className="w-screen flex flex-col gap-2">
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
            <div id="header-mobile-search" className="px-2 py-2">
              <SearchBar idPrefix="header-mobile-search" onResultClick={() => setMenuOpen(false)} />
            </div>
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

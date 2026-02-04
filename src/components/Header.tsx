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

  return (
    <header className="sticky top-0 left-0 w-full flex items-center shadow-md bg-semi-transparent backdrop-blur-sm z-10">
      {/* Logo and Nav Items - Left Side */}
      <div className="flex items-center">
        {/* Logo */}
        <div
          className="pl-2 cursor-pointer"
          onClick={() => navigate({ to: '/' })}
        >
          <NGS360Logo iconSize="max-w-[35px]" textSize="text-xl" gap="gap-2" className="p-2" />
        </div>

        {/* Desktop Nav Items */}
        <div className="hidden xl:block ml-4">
          <NavigationMenu>
            <NavigationMenuList className="gap-4">
              {navItems.map(({ to, label, icon, search, isExternal }) => (
                <NavigationMenuItem key={to}>
                  <NavigationMenuLink asChild>
                    {isExternal ? (
                      <a href={to} target="_blank" rel="noopener noreferrer">
                        <div className='flex items-center gap-1'>
                          {icon}
                          {label}
                        </div>
                      </a>
                    ) : (
                      <Link to={to} search={search}>
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
      <div className="flex items-center gap-3 ml-auto pr-2">
        {/* Search bar - narrower version for header */}
        <div className="hidden xl:block w-64 xl:w-80">
          <SearchBar />
        </div>

        {/* Desktop Create Button */}
        <div className="hidden xl:block">
          <CreateProjectForm
            trigger={(
              <Button>Create Project</Button>
            )}
          />
        </div>

        {/* Notifications Dropdown - Only show when authenticated */}
        {isAuthenticated && (
          <div className="hidden xl:block">
            <NotificationsDropdown />
          </div>
        )}

        {/* Avatar or Sign In */}
        <div>
          {isAuthenticated ? (
            <UserAvatar />
          ) : (
            <Link to="/login">
              <Button variant="outline">
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
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
          <DropdownMenuContent align="end" sideOffset={4} className="w-screen flex flex-col gap-2">
            {navItems.map(({ to, label, icon, search, isExternal }) => (
              <DropdownMenuItem asChild key={to} className='w-full justify-center'>
                {isExternal ? (
                  <a href={to} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>
                    <div className='flex items-center gap-1'>
                      {icon}
                      {label}
                    </div>
                  </a>
                ) : (
                  <Link to={to} search={search} onClick={() => setMenuOpen(false)}>
                    <div className='flex items-center gap-1'>
                      {icon}
                      {label}
                    </div>
                  </Link>
                )}
              </DropdownMenuItem>
            ))}
            <div className="px-2 py-2">
              <SearchBar onResultClick={() => setMenuOpen(false)} />
            </div>
            <DropdownMenuItem asChild>
              <CreateProjectForm
                trigger={(
                  <Button className='w-full'>Create ProjectID</Button>
                )}
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

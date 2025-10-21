import { Link, useNavigate } from '@tanstack/react-router'
import { Building, Database, Folder, MenuIcon, Settings, ShieldCheck, XIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from './ui/button'
import { CreateProjectForm } from './create-project-form'
import circosLogo from '@/img/circos_color.svg'
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
import { useIsMobile } from '@/hooks/use-mobile'

type NavItemType = {
  to: string
  label: string
  icon?: React.ReactNode
  search?: {}
}

export default function Header() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [menuOpen, setMenuOpen] = useState(false)

  const logoMap = [
    ['N', '#9de073'],
    ['G', '#68706e'],
    ['S', '#25aedd'],
    ['3', '#eb6341'],
    ['6', '#ffc180'],
    ['0', '#9de073'],
  ]

  const navItems: Array<NavItemType> = [
    { to: '/runs', label: 'Illumina Runs', icon: <Database className="inline mr-1" /> },
    { to: '/projects', label: 'Projects', icon: <Folder className="inline mr-1" />, search: {sort_by: undefined, sort_order: undefined} },
    { to: '/admin', label: 'Admin', icon: <ShieldCheck className="inline mr-1" /> }
  ]

  return (
    <header className="sticky top-0 left-0 w-full flex justify-between items-center shadow-md bg-semi-transparent backdrop-blur-sm z-10">
      {/* Logo */}
      <div
        className="flex items-center pl-2 cursor-pointer"
        onClick={() => navigate({ to: '/' })}
      >
        <img src={circosLogo} style={{ maxWidth: '35px' }} alt="NGS360 logo" />
        <div className="p-2 flex">
          {logoMap.map(([char, color]) => (
            <span key={char} className="font-bold text-xl" style={{ color }}>
              {char}
            </span>
          ))}
        </div>
      </div>

      {/* Nav menu */}
      <div className="pr-2">
        {isMobile ? (
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="md:hidden"
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
              {navItems.map(({ to, label, icon, search }) => (
                <DropdownMenuItem asChild key={to} className='w-full justify-center'>
                  <Link to={to} search={search} onClick={() => setMenuOpen(false)}>
                    <div className='flex items-center gap-1'>
                      {icon}
                      {label}
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem asChild>
                <CreateProjectForm
                  trigger={(
                    <Button className='w-full'>Create ProjectID</Button>
                  )}
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          /* Desktop menu (using NavigationMenu) */
          <NavigationMenu>
            <NavigationMenuList className="gap-4">
              {navItems.map(({ to, label, icon, search }) => (
                <NavigationMenuItem key={to}>
                  <NavigationMenuLink asChild>
                    <Link to={to} search={search}>
                    <div className='flex items-center gap-1'>
                        {icon}
                        {label}
                    </div>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
              <CreateProjectForm
                trigger={(
                  <Button>Create ProjectID</Button>
                )}
              />
            </NavigationMenuList>
          </NavigationMenu>
        )}
      </div>
    </header>
  )
}

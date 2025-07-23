import { Link, useNavigate } from '@tanstack/react-router'
import { MenuIcon, XIcon } from 'lucide-react'
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
}

export default function Header() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [menuOpen, setMenuOpen] = useState(false)

  const logoMap = [
    ['N', '#4CAF50'],
    ['G', '#000000'],
    ['S', '#2196F3'],
    ['3', '#F44336'],
    ['6', '#4CAF50'],
    ['0', '#2196F3'],
  ]

  const navItems: Array<NavItemType> = [{ to: '/projects', label: 'Projects' }]

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
            <span key={char} className="font-bold text-2xl" style={{ color }}>
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
            <DropdownMenuContent align="end" sideOffset={4} className="w-48">
              {navItems.map(({ to, label }) => (
                <DropdownMenuItem asChild key={to}>
                  <Link to={to} onClick={() => setMenuOpen(false)}>
                    {label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem asChild>
                <CreateProjectForm
                  trigger={(
                    <Button>Create ProjectID</Button>
                  )}
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          /* Desktop menu (using NavigationMenu) */
          <NavigationMenu>
            <NavigationMenuList className="gap-4">
              {navItems.map(({ to, label }) => (
                <NavigationMenuItem key={to}>
                  <NavigationMenuLink asChild>
                    <Link to={to}>{label}</Link>
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

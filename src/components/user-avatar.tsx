import { ListChecks, LogOut, User } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { getGravatarUrl } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/context/auth-context'
import { useCurrentUser } from '@/hooks/use-current-user'

export function UserAvatar() {
  const { logout } = useAuth();
  const { data: user } = useCurrentUser();
  const navigate = useNavigate();
  const userEmail = user?.email || '';
  const avatarUrl = getGravatarUrl(userEmail)
  
  const handleLogout = async () => {
    await navigate({ to: '/login' });
    await logout();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer">
          <AvatarImage src={avatarUrl} alt={userEmail} />
          <AvatarFallback>{userEmail.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/jobs" className="cursor-pointer">
            <ListChecks className="mr-2 h-4 w-4" />
            <span>My Jobs</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

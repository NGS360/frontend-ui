import { BadgeCheck, CircleSlash, MailWarning, ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface UserStatusBadgesProps {
  isActive: boolean
  isVerified: boolean
  isSuperuser: boolean
  /** Show a badge for the ordinary case too. Default: only exceptions. */
  verbose?: boolean
}

/**
 * The three account flags, as badges.
 *
 * By default only the notable states get a badge — deactivated, unverified,
 * superuser — because a roster where every row carries "Active" and "Verified"
 * chips is a roster where the one deactivated account does not stand out.
 *
 * Deactivated and unverified are both rendered because they are not the same
 * problem: get_current_active_user rejects either one, but an unverified
 * account is usually a signup that never finished, while a deactivated one was
 * a decision somebody made.
 */
export const UserStatusBadges = ({
  isActive,
  isVerified,
  isSuperuser,
  verbose = false,
}: UserStatusBadgesProps) => (
  <div className="flex flex-wrap items-center gap-1.5">
    {isSuperuser && (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="destructive">
            <ShieldAlert />
            Superuser
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Break-glass access: bypasses every permission check.</p>
        </TooltipContent>
      </Tooltip>
    )}
    {!isActive && (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="text-muted-foreground">
            <CircleSlash />
            Deactivated
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Cannot sign in. Roles and memberships are kept.</p>
        </TooltipContent>
      </Tooltip>
    )}
    {!isVerified && (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline">
            <MailWarning />
            Unverified
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Email is unverified, which also blocks sign-in.</p>
        </TooltipContent>
      </Tooltip>
    )}
    {verbose && isActive && isVerified && (
      <Badge variant="secondary">
        <BadgeCheck />
        Active
      </Badge>
    )}
  </div>
)

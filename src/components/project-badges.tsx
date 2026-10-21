import { Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/**
 * Whether a project is closed to everyone outside its member list.
 *
 * Rendered wherever a project is named, and to everyone rather than only to
 * people who can change it: with an opt-in control the dangerous state is a
 * project nobody remembered to restrict, and that is only legible if the open
 * state is something a page says rather than implies.
 *
 * The icon alone, because a padlock reads at a glance beside a title. The
 * sentence is a hover away, with an sr-only copy for anyone who cannot hover.
 */
export const ProjectRestrictedBadge = ({ className }: { className?: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Badge variant="default" className={cn('px-1.5', className)}>
        <Lock />
        <span className="sr-only">Restricted to members</span>
      </Badge>
    </TooltipTrigger>
    <TooltipContent>
      <p className="max-w-xs">
        Restricted to members. Only people on this project&apos;s member list
        can see it or download its files.
      </p>
    </TooltipContent>
  </Tooltip>
)

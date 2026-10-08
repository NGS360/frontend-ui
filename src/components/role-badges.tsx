import { Link } from '@tanstack/react-router'
import type { RoleScope } from '@/client'
import { Badge } from '@/components/ui/badge'

interface RoleBadgesProps {
  roles: Array<string>
  /** Link each badge to its role page. Default: plain badges. */
  linked?: boolean
  emptyLabel?: string
}

/**
 * A user's role names as badges.
 *
 * An empty list is spelled out rather than left blank: holding no role is a
 * real and actionable state — the server grants DEFAULT_USER_ROLE at creation,
 * so a user with none either predates that or had it revoked, and they get 403s
 * until somebody notices.
 */
export const RoleBadges = ({ roles, linked = false, emptyLabel = 'No roles' }: RoleBadgesProps) => {
  if (roles.length === 0) {
    return <span className="text-xs text-muted-foreground">{emptyLabel}</span>
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {roles.map((role) =>
        linked ? (
          <Badge key={role} variant="secondary" asChild>
            <Link to="/admin/roles/$name" params={{ name: role }}>
              {role}
            </Link>
          </Badge>
        ) : (
          <Badge key={role} variant="secondary">
            {role}
          </Badge>
        ),
      )}
    </div>
  )
}

/**
 * Which plane a role is granted in.
 *
 * Worth a badge on every role: it decides which endpoint grants it, and a
 * project role offered in the global picker (or the reverse) is a 400 from the
 * server rather than a subtle mistake.
 */
export const RoleScopeBadge = ({ scope }: { scope: RoleScope }) => (
  <Badge variant={scope === 'global' ? 'default' : 'outline'}>
    {scope === 'global' ? 'Global' : 'Project'}
  </Badge>
)

/**
 * Whether a role is code-defined.
 *
 * Builtin permission sets are re-derived from api/rbac/roles.py on every
 * deploy, so an edit here would be silently undone — which is why the API
 * refuses it, and why the UI says so before anyone tries.
 */
export const RoleBuiltinBadge = ({ isBuiltin }: { isBuiltin: boolean }) =>
  isBuiltin ? (
    <Badge variant="outline" className="text-muted-foreground">
      Built-in
    </Badge>
  ) : (
    <Badge variant="secondary">Custom</Badge>
  )

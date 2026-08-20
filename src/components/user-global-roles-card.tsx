import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { LoaderCircle, Plus, X } from 'lucide-react'
import type { UserAccessPublic } from '@/client'
import {
  getUserAccessQueryKey,
  grantUserRoleMutation,
  listRolesOptions,
  listUsersQueryKey,
  revokeUserRoleMutation,
} from '@/client/@tanstack/react-query.gen'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toastApiError } from '@/lib/error-utils'
import { PERMISSIONS } from '@/lib/permissions'
import { useMyAccess } from '@/hooks/use-my-access'

interface UserGlobalRolesCardProps {
  user: UserAccessPublic
}

/**
 * Grant and revoke global roles.
 *
 * Global grants are additive — `member` plus `service_account` is a legitimate
 * combination — which is why this is a set with individual revokes rather than a
 * single-select. Project roles are exclusive per project and live on the project
 * page instead, so the picker here only offers global-scoped roles; offering a
 * project role would only earn a 400 from the server.
 */
export const UserGlobalRolesCard = ({ user }: UserGlobalRolesCardProps) => {
  const queryClient = useQueryClient()
  const { can } = useMyAccess()
  const mayManage = can(PERMISSIONS.ROLE_MANAGE)
  const [chosen, setChosen] = useState<string>('')

  const { data: roles } = useQuery(listRolesOptions())
  const grantable = (roles ?? []).filter(
    (role) => role.scope === 'global' && !user.global_roles.includes(role.name),
  )

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: getUserAccessQueryKey({ path: { username: user.username } }),
    })
    void queryClient.invalidateQueries({ queryKey: listUsersQueryKey() })
  }

  const { mutate: grant, isPending: isGranting } = useMutation({
    ...grantUserRoleMutation(),
    onSuccess: () => {
      invalidate()
      toast.success(`Granted ${chosen} to ${user.username}`)
      setChosen('')
    },
    onError: (error) => toastApiError(error, 'Could not grant that role'),
  })

  const { mutate: revoke, isPending: isRevoking } = useMutation({
    ...revokeUserRoleMutation(),
    onSuccess: (_data, variables) => {
      invalidate()
      toast.success(`Revoked ${variables.path.role_name} from ${user.username}`)
    },
    // The server refuses to revoke the last non-superuser role:manage holder,
    // and that 409 explains itself better than anything this page could infer.
    onError: (error) => toastApiError(error, 'Could not revoke that role'),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global roles</CardTitle>
        <CardDescription>
          Platform-wide grants. Additive: a user may hold several, and their
          permissions are the union.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {user.is_superuser && (
          <p className="text-xs text-muted-foreground">
            This account is a superuser, so it passes every permission check
            regardless of the roles below.
          </p>
        )}

        {user.global_roles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No roles. This account holds no permissions at all and will be
            refused on every endpoint until one is granted.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {user.global_roles.map((name) => {
              const role = roles?.find((r) => r.name === name)
              return (
                <Badge key={name} variant="secondary" className="gap-1 pr-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>{role?.display_name ?? name}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{role?.description ?? name}</p>
                    </TooltipContent>
                  </Tooltip>
                  {mayManage && (
                    <Button
                      id={`revoke-role-${name}`}
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4"
                      disabled={isRevoking}
                      onClick={() =>
                        revoke({ path: { username: user.username, role_name: name } })
                      }
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Revoke {name}</span>
                    </Button>
                  )}
                </Badge>
              )
            })}
          </div>
        )}

        {mayManage ? (
          <div className="flex flex-wrap items-center gap-2">
            <Select value={chosen} onValueChange={setChosen}>
              <SelectTrigger id="grant-role-select" className="w-[240px]">
                <SelectValue placeholder="Grant a role" />
              </SelectTrigger>
              <SelectContent>
                {grantable.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Every global role is already held
                  </SelectItem>
                ) : (
                  grantable.map((role) => (
                    <SelectItem key={role.name} value={role.name}>
                      {role.display_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              id="grant-role-submit"
              variant="primary2"
              disabled={!chosen || isGranting}
              onClick={() =>
                grant({ path: { username: user.username }, body: { role: chosen } })
              }
            >
              {isGranting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Grant
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Granting and revoking requires {PERMISSIONS.ROLE_MANAGE}.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { LoaderCircle } from 'lucide-react'
import type { UserAccessPublic } from '@/client'
import {
  getUserAccessQueryKey,
  listUsersQueryKey,
  updateUserFlagsMutation,
} from '@/client/@tanstack/react-query.gen'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toastApiError } from '@/lib/error-utils'
import { PERMISSIONS } from '@/lib/permissions'
import { useMyAccess } from '@/hooks/use-my-access'

interface UserFlagsCardProps {
  user: UserAccessPublic
}

type Flag = 'is_active' | 'is_verified' | 'is_superuser'

/**
 * The three account flags, as switches.
 *
 * Grouped because they are one decision — may this account be used, and how far
 * — and because the server treats them that way: PATCH /users/{username} takes
 * all three, and both is_active and is_verified are required to authenticate,
 * so clearing either is a lockout rather than a downgrade.
 *
 * The refusals the server can return (the last usable superuser, the last
 * non-superuser role manager, anything done to your own account) are surfaced as
 * toasts rather than pre-empted here. The check has to happen server-side to be
 * correct — it depends on rows this page has not loaded — and a UI that guessed
 * would either block something legitimate or promise something that then fails.
 */
export const UserFlagsCard = ({ user }: UserFlagsCardProps) => {
  const queryClient = useQueryClient()
  const { can, access } = useMyAccess()
  const [pendingFlag, setPendingFlag] = useState<Flag | null>(null)

  const mayManage = can(PERMISSIONS.USER_MANAGE)
  const isSelf = access?.username === user.username

  const { mutate, isPending } = useMutation({
    ...updateUserFlagsMutation(),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: getUserAccessQueryKey({ path: { username: user.username } }),
      })
      void queryClient.invalidateQueries({ queryKey: listUsersQueryKey() })
      // Own flags changed means own access changed, so the gating cache is stale.
      if (isSelf) void queryClient.invalidateQueries({ queryKey: ['getMyAccess'] })
      const [[flag, value]] = Object.entries(variables.body) as Array<[Flag, boolean]>
      toast.success(`${LABELS[flag].title} ${value ? 'enabled' : 'disabled'} for ${user.username}`)
    },
    onError: (error) => {
      toastApiError(error, `Could not update ${user.username}`)
    },
    onSettled: () => setPendingFlag(null),
  })

  const set = (flag: Flag, value: boolean) => {
    setPendingFlag(flag)
    // Only the flag being changed is sent. The server treats an omitted field
    // as "leave alone", so this cannot clobber the other two with stale values.
    mutate({ path: { username: user.username }, body: { [flag]: value } })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account status</CardTitle>
        <CardDescription>
          Signing in requires both active and verified. Turning off either one
          locks the account out; roles and project memberships are kept.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {(['is_active', 'is_verified', 'is_superuser'] as Array<Flag>).map((flag) => (
          <div key={flag} className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor={`user-flag-${flag}`}>{LABELS[flag].title}</Label>
              <p className="text-xs text-muted-foreground">{LABELS[flag].description}</p>
            </div>
            <div className="flex items-center gap-2">
              {isPending && pendingFlag === flag && (
                <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <Switch
                id={`user-flag-${flag}`}
                checked={user[flag]}
                disabled={!mayManage || isPending}
                onCheckedChange={(checked) => set(flag, checked)}
              />
            </div>
          </div>
        ))}

        {!mayManage && (
          <p className="text-xs text-muted-foreground">
            Changing these requires {PERMISSIONS.USER_MANAGE}.
          </p>
        )}
        {isSelf && (
          <p className="text-xs text-muted-foreground">
            This is your own account. You cannot lock yourself out or remove your
            own superuser flag.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

const LABELS: Record<Flag, { title: string; description: string }> = {
  is_active: {
    title: 'Active',
    description: 'Off is the deactivation path for someone who has left.',
  },
  is_verified: {
    title: 'Email verified',
    description: 'Usually a signup that was never completed.',
  },
  is_superuser: {
    title: 'Superuser',
    description:
      'Break-glass access that bypasses every permission check. Prefer granting the admin role.',
  },
}

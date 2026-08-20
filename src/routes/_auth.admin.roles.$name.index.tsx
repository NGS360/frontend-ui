import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, LoaderCircle, Trash2, Users } from 'lucide-react'
import {
  deleteRoleMutation,
  getRoleOptions,
  getRoleQueryKey,
  listPermissionsOptions,
  listRolesQueryKey,
  updateRolePermissionsMutation,
} from '@/client/@tanstack/react-query.gen'
import { ErrorState } from '@/components/error-state'
import { PermissionMatrix } from '@/components/permission-matrix'
import { RoleBuiltinBadge, RoleScopeBadge } from '@/components/role-badges'
import { FullscreenSpinner } from '@/components/spinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toastApiError } from '@/lib/error-utils'
import { useMyAccess } from '@/hooks/use-my-access'
import { PERMISSIONS } from '@/lib/permissions'

export const Route = createFileRoute('/_auth/admin/roles/$name/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { name } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { can } = useMyAccess()
  const mayManage = can(PERMISSIONS.ROLE_MANAGE)

  const { data: role, error, refetch } = useQuery(getRoleOptions({ path: { name } }))
  const { data: catalog } = useQuery(listPermissionsOptions())

  // Draft state, so a half-finished edit is not a request. Reset whenever the
  // server's version changes, which also discards the draft after a save.
  const [draft, setDraft] = useState<Array<string> | null>(null)
  useEffect(() => {
    setDraft(null)
  }, [role?.permissions.join(',')])

  const selected = draft ?? role?.permissions ?? []
  const isDirty = draft !== null && role !== undefined &&
    (draft.length !== role.permissions.length ||
      draft.some((permission) => !role.permissions.includes(permission)))

  const { mutate: save, isPending: isSaving } = useMutation({
    ...updateRolePermissionsMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: getRoleQueryKey({ path: { name } }) })
      void queryClient.invalidateQueries({ queryKey: listRolesQueryKey() })
      toast.success(`Updated ${name}`)
      setDraft(null)
    },
    onError: (mutationError) => toastApiError(mutationError, `Could not update ${name}`),
  })

  const { mutate: remove, isPending: isDeleting } = useMutation({
    ...deleteRoleMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: listRolesQueryKey() })
      toast.success(`Deleted ${name}`)
      void navigate({ to: '/admin/roles' })
    },
    // The server refuses to delete a role that is still granted, and says how
    // many grants stand in the way. That is more useful than anything the UI
    // could compute without a holders endpoint.
    onError: (mutationError) => toastApiError(mutationError, `Could not delete ${name}`),
  })

  if (error) return <ErrorState error={error} onRetry={() => { void refetch() }} />
  if (!role) return <FullscreenSpinner variant="ellipsis" />

  const editable = mayManage && !role.is_builtin

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl">{role.display_name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">{role.name}</span>
            <RoleScopeBadge scope={role.scope} />
            <RoleBuiltinBadge is_builtin={role.is_builtin} />
          </div>
          {role.description && (
            <p className="text-muted-foreground">{role.description}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {role.scope === 'global' && (
            <Button variant="secondary" asChild>
              <Link to="/admin/users" search={{ role: role.name }}>
                <Users className="h-4 w-4" />
                Holders
              </Link>
            </Button>
          )}
          <Button variant="secondary" asChild>
            <Link to="/admin/roles">
              <ArrowLeft className="h-4 w-4" />
              All roles
            </Link>
          </Button>
        </div>
      </div>

      {role.is_builtin && (
        <Card>
          <CardHeader>
            <CardTitle>This role is defined in code</CardTitle>
            <CardDescription>
              Its permissions come from <span className="font-mono text-xs">api/rbac/roles.py</span> and
              are re-derived on every deploy, so an edit here would be silently
              undone. Changing it is a reviewed code change; if you need a
              variant, create a custom role instead.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Permissions ({selected.length})</CardTitle>
          <CardDescription>
            {editable
              ? 'Editing replaces the whole set. Nothing is sent until you save.'
              : 'Read-only.'}
            {role.scope === 'project' &&
              ' Only project-scopable permissions can appear in a project role.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {catalog ? (
            <PermissionMatrix
              catalog={catalog}
              selected={selected}
              onChange={editable ? setDraft : undefined}
              projectScopableOnly={role.scope === 'project'}
              selectedOnly={!editable}
              idPrefix={`role-${role.name}-permissions`}
            />
          ) : (
            <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />
          )}

          {editable && (
            <div className="flex items-center gap-2">
              <Button
                id="role-save"
                disabled={!isDirty || isSaving}
                onClick={() => save({ path: { name }, body: { permissions: selected } })}
              >
                {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {isSaving ? 'Saving...' : 'Save permissions'}
              </Button>
              <Button
                id="role-discard"
                variant="secondary"
                disabled={!isDirty || isSaving}
                onClick={() => setDraft(null)}
              >
                Discard changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {mayManage && !role.is_builtin && (
        <Card>
          <CardHeader>
            <CardTitle>Delete this role</CardTitle>
            <CardDescription>
              Only possible while nobody holds it. Revoke it from its holders
              first — the server will refuse otherwise rather than silently
              taking away their access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              id="role-delete"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => {
                const confirmed = window.confirm(
                  `Delete the role "${role.display_name}"? This cannot be undone.`,
                )
                if (confirmed) remove({ path: { name } })
              }}
            >
              {isDeleting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete role
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

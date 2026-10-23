import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { LoaderCircle, Plus, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import z from 'zod'
import type { RolePublic } from '@/client'
import { deleteRoleMutation, listRolesOptions, listRolesQueryKey } from '@/client/@tanstack/react-query.gen'
import { CreateRoleForm } from '@/components/create-role-form'
import { ErrorState } from '@/components/error-state'
import { RoleBuiltinBadge, RoleScopeBadge } from '@/components/role-badges'
import { FullscreenSpinner } from '@/components/spinner'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useMyAccess } from '@/hooks/use-my-access'
import { toastApiError } from '@/lib/error-utils'

// In the URL rather than component state, matching the roster: which plane you
// are looking at is part of where you are, so a link to the project roles is a
// link somebody can paste into a ticket, and a refresh does not silently move
// you back to global.
const rolesSearchSchema = z.object({
  // optional().default() so a plain /admin/roles link needs no search param,
  // and .catch() on top of it so a hand-edited or stale ?scope= lands on the
  // global tab rather than throwing out of validateSearch and putting an error
  // boundary where the page was.
  scope: z.union([z.literal('global'), z.literal('project')])
    .optional().default('global').catch('global'),
})

export const Route = createFileRoute('/_auth/admin/roles/')({
  component: RouteComponent,
  validateSearch: rolesSearchSchema,
})

interface RolesTableProps {
  roles: Array<RolePublic>
  onDelete?: (role: RolePublic) => void
  deletingName?: string
}

const RolesTable = ({ roles, onDelete, deletingName }: RolesTableProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Role</TableHead>
        <TableHead>Name</TableHead>
        <TableHead>Kind</TableHead>
        <TableHead className="text-right">Permissions</TableHead>
        <TableHead />
      </TableRow>
    </TableHeader>
    <TableBody>
      {roles.map((role) => (
        <TableRow key={role.name}>
          <TableCell>
            <Link
              to="/admin/roles/$name"
              params={{ name: role.name }}
              className="text-sm font-medium text-primary hover:underline"
            >
              {role.display_name}
            </Link>
            {role.description && (
              <p className="text-xs text-muted-foreground">{role.description}</p>
            )}
          </TableCell>
          <TableCell className="font-mono text-xs text-muted-foreground">
            {role.name}
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-1.5">
              <RoleScopeBadge scope={role.scope} />
              <RoleBuiltinBadge isBuiltin={role.is_builtin} />
            </div>
          </TableCell>
          <TableCell className="text-right text-sm">{role.permissions.length}</TableCell>
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1">
              {role.scope === 'global' && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin/users" search={{ role: role.name }}>
                    <Users className="h-4 w-4" />
                    Holders
                  </Link>
                </Button>
              )}
              {onDelete && (
                role.is_builtin ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex">
                        <Button variant="ghost" size="sm" disabled>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete {role.display_name}</span>
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Built-in roles are defined in code and re-derived on
                        every deploy, so they cannot be deleted. Create a
                        custom role instead.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Button
                    id={`admin-roles-delete-${role.name}`}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={deletingName === role.name}
                    onClick={() => onDelete(role)}
                  >
                    {deletingName === role.name
                      ? <LoaderCircle className="h-4 w-4 animate-spin" />
                      : <Trash2 className="h-4 w-4" />}
                    <span className="sr-only">Delete {role.display_name}</span>
                  </Button>
                )
              )}
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
)

function RouteComponent() {
  const { can } = useMyAccess()
  const { scope } = Route.useSearch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: roles, error, refetch } = useQuery(listRolesOptions())

  const { mutate: remove, variables: removing, isPending: isDeleting } = useMutation({
    ...deleteRoleMutation(),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: listRolesQueryKey() })
      toast.success(`Deleted ${variables.path.name}`)
    },
    onError: (mutationError, variables) =>
      toastApiError(mutationError, `Could not delete ${variables.path.name}`),
  })

  const onDelete = can('role:manage')
    ? (role: RolePublic) => {
        const confirmed = window.confirm(
          `Delete the role "${role.display_name}"? This cannot be undone.`,
        )
        if (confirmed) remove({ path: { name: role.name } })
      }
    : undefined
  const deletingName = isDeleting ? removing.path.name : undefined

  if (error) return <ErrorState error={error} onRetry={() => { void refetch() }} />
  if (!roles) return <FullscreenSpinner variant="ellipsis" />

  // The two planes are granted through different endpoints and mean different
  // things, which is why they are separated at all rather than sorted together.
  const globalRoles = roles.filter((role) => role.scope === 'global')
  const projectRoles = roles.filter((role) => role.scope === 'project')

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 @3xl:flex-row @3xl:items-end @3xl:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl">Roles</h1>
          <p className="text-muted-foreground">
            A role is a named set of permissions. Built-in roles are defined in
            code and re-derived on every deploy; custom roles are yours to edit.
          </p>
        </div>
        {can('role:manage') && (
          <CreateRoleForm
            idPrefix="admin-roles-create-role"
            trigger={
              <Button variant="primary2" className="w-full @3xl:w-auto">
                <Plus className="h-4 w-4" />
                Create Role
              </Button>
            }
          />
        )}
      </div>

      <Tabs
        value={scope}
        onValueChange={(value) =>
          // replace, so flipping between the two planes does not fill the back
          // button with tab changes on the way to the page you arrived from.
          navigate({
            to: '/admin/roles',
            search: { scope: value as 'global' | 'project' },
            replace: true,
          })
        }
        className="gap-4"
      >
        <TabsList id="admin-roles-scope-tabs">
          {/* Counted, because the counts are the reason to pick one: fifteen
              global roles and three project ones is the shape of the model. */}
          <TabsTrigger id="admin-roles-scope-global" value="global">
            Global ({globalRoles.length})
          </TabsTrigger>
          <TabsTrigger id="admin-roles-scope-project" value="project">
            Project ({projectRoles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Granted platform-wide, and additive: a user may hold several.
          </p>
          <RolesTable roles={globalRoles} onDelete={onDelete} deletingName={deletingName} />
        </TabsContent>

        <TabsContent value="project" className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Granted per project from the project page, one per user per project.
            Viewer, contributor and owner form a total order.
          </p>
          <RolesTable roles={projectRoles} onDelete={onDelete} deletingName={deletingName} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

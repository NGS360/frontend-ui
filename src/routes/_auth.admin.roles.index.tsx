import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus, Users } from 'lucide-react'
import z from 'zod'
import type { RolePublic } from '@/client'
import { listRolesOptions } from '@/client/@tanstack/react-query.gen'
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
import { useMyAccess } from '@/hooks/use-my-access'
import { PERMISSIONS } from '@/lib/permissions'

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
}

const RolesTable = ({ roles }: RolesTableProps) => (
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
            {/* Holder counts have no endpoint, and one request per role to
                fake them would be worse than a link that answers exactly
                the question with a real filtered list. Project roles are
                excluded: the roster filters on global grants only. */}
            {role.scope === 'global' && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/users" search={{ role: role.name }}>
                  <Users className="h-4 w-4" />
                  Holders
                </Link>
              </Button>
            )}
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
  const { data: roles, error, refetch } = useQuery(listRolesOptions())

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
        {can(PERMISSIONS.ROLE_MANAGE) && (
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
          <RolesTable roles={globalRoles} />
        </TabsContent>

        <TabsContent value="project" className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Granted per project from the project page, one per user per project.
            Viewer, contributor and owner form a total order.
          </p>
          <RolesTable roles={projectRoles} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

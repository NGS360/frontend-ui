import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Plus, Users } from 'lucide-react'
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
import { useMyAccess } from '@/hooks/use-my-access'
import { PERMISSIONS } from '@/lib/permissions'

export const Route = createFileRoute('/_auth/admin/roles/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { can } = useMyAccess()
  const { data: roles, error, refetch } = useQuery(listRolesOptions())

  if (error) return <ErrorState error={error} onRetry={() => { void refetch() }} />
  if (!roles) return <FullscreenSpinner variant="ellipsis" />

  // Global first, then project: the two planes are granted through different
  // endpoints and mean different things, so mixing them alphabetically would
  // bury the distinction that matters most on this page.
  const globalRoles = roles.filter((role) => role.scope === 'global')
  const projectRoles = roles.filter((role) => role.scope === 'project')

  const section = (title: string, description: string, rows: typeof roles) => (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
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
          {rows.map((role) => (
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
                  <RoleBuiltinBadge is_builtin={role.is_builtin} />
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
    </div>
  )

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
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
              <Button variant="primary2" className="w-full md:w-auto">
                <Plus className="h-4 w-4" />
                Create Role
              </Button>
            }
          />
        )}
      </div>

      {section(
        'Global roles',
        'Granted platform-wide, and additive: a user may hold several.',
        globalRoles,
      )}
      {section(
        'Project roles',
        'Granted per project from the project page, one per user per project. Viewer, contributor and owner form a total order.',
        projectRoles,
      )}
    </div>
  )
}

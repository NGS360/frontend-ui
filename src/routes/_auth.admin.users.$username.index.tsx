import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import {
  getUserAccessOptions,
  listPermissionsOptions,
} from '@/client/@tanstack/react-query.gen'
import { ErrorState } from '@/components/error-state'
import { PermissionMatrix } from '@/components/permission-matrix'
import { FullscreenSpinner } from '@/components/spinner'
import { UserFlagsCard } from '@/components/user-flags-card'
import { UserGlobalRolesCard } from '@/components/user-global-roles-card'
import { UserStatusBadges } from '@/components/user-status-badges'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const Route = createFileRoute('/_auth/admin/users/$username/')({
  component: RouteComponent,
})

// A user who created a lot of projects holds a membership on every one of
// them -- the backfill granted project_owner to each creator, and real accounts
// on this deployment reach 246 -- so the table is capped rather than rendering
// the lot into the page by default.
const MEMBERSHIP_PREVIEW = 25

function RouteComponent() {
  const { username } = Route.useParams()
  const [showAllMemberships, setShowAllMemberships] = useState(false)

  const { data: user, error, refetch } = useQuery(
    getUserAccessOptions({ path: { username } }),
  )
  // The catalog gives each permission its description and risk. Without it the
  // effective set is 57 opaque strings, which is data rather than an answer.
  const { data: catalog } = useQuery(listPermissionsOptions())

  if (error) return <ErrorState error={error} onRetry={() => { void refetch() }} />
  if (!user) return <FullscreenSpinner variant="ellipsis" />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl">{user.full_name ?? user.username}</h1>
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
            <span className="font-mono text-sm">{user.username}</span>
            {user.email && <span className="text-sm">{user.email}</span>}
          </div>
          <UserStatusBadges
            is_active={user.is_active}
            is_verified={user.is_verified}
            is_superuser={user.is_superuser}
            verbose
          />
        </div>
        <Button variant="secondary" asChild>
          <Link to="/admin/users">
            <ArrowLeft className="h-4 w-4" />
            All users
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UserGlobalRolesCard user={user} />
        <UserFlagsCard user={user} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project access</CardTitle>
          <CardDescription>
            Project roles are exclusive: one per project, and they only apply to
            that project. Change them from the project's own page, where the
            owner can do it without an administrator.
            {user.project_memberships.length > 0 &&
              ` ${user.project_memberships.length} membership${user.project_memberships.length === 1 ? '' : 's'}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user.project_memberships.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Not a member of any project.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Granted</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(showAllMemberships
                  ? user.project_memberships
                  : user.project_memberships.slice(0, MEMBERSHIP_PREVIEW)
                ).map((membership) => (
                  <TableRow key={membership.project_id}>
                    <TableCell>
                      <Link
                        to="/projects/$project_id"
                        params={{ project_id: membership.project_id }}
                        className="text-sm text-primary hover:underline"
                      >
                        {membership.project_name ?? membership.project_id}
                      </Link>
                      <span className="ml-2 font-mono text-xs text-muted-foreground">
                        {membership.project_id}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{membership.role}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(membership.granted_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {/* 'migration' means the backfill inferred this from
                          project.created_by rather than anyone deciding it. */}
                      <Badge variant="outline" className="text-muted-foreground">
                        {membership.source}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {user.project_memberships.length > MEMBERSHIP_PREVIEW && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Showing{' '}
                {showAllMemberships
                  ? user.project_memberships.length
                  : MEMBERSHIP_PREVIEW}{' '}
                of {user.project_memberships.length} projects.
              </span>
              <Button
                id="user-memberships-toggle"
                variant="ghost"
                size="sm"
                onClick={() => setShowAllMemberships((current) => !current)}
              >
                {showAllMemberships ? 'Show fewer' : 'Show all'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Effective permissions</CardTitle>
          <CardDescription>
            {user.is_superuser
              ? 'Every permission in the catalog, because this account is a superuser.'
              : `The union of ${user.global_roles.length || 'no'} global role${user.global_roles.length === 1 ? '' : 's'}. Project-scoped permissions are not included: they apply only inside the projects listed above.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {catalog ? (
            <PermissionMatrix
              catalog={catalog}
              selected={user.global_permissions}
              selectedOnly
              idPrefix={`user-${user.username}-permissions`}
            />
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {user.global_permissions.map((permission) => (
                <Badge key={permission} variant="outline" className="font-mono text-xs">
                  {permission}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

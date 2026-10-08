import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { KeyRound, ShieldCheck, Users } from 'lucide-react'
import {
  listPermissionsOptions,
  listRolesOptions,
  listUsersOptions,
} from '@/client/@tanstack/react-query.gen'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useMyAccess } from '@/hooks/use-my-access'
import { PERMISSIONS } from '@/lib/permissions'

export const Route = createFileRoute('/_auth/admin/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { can } = useMyAccess()
  const mayReadAccess = can(PERMISSIONS.ROLE_READ)

  // limit=1 because only the count is wanted here. The roster page fetches the
  // rows; asking for a page of them to display one number would be waste.
  const { data: users } = useQuery({
    ...listUsersOptions({ query: { limit: 1 } }),
    enabled: mayReadAccess,
  })
  const { data: roles } = useQuery({ ...listRolesOptions(), enabled: mayReadAccess })
  const { data: permissions } = useQuery({
    ...listPermissionsOptions(),
    enabled: mayReadAccess,
  })

  const customRoles = (roles ?? []).filter((role) => !role.is_builtin).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Platform configuration and access management.
        </p>
      </div>

      {mayReadAccess && (
        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/admin/users">
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </CardTitle>
                <CardDescription>
                  Accounts, their roles, and account status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl">{users?.total_items ?? '—'}</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/roles">
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Roles
                </CardTitle>
                <CardDescription>
                  {customRoles > 0
                    ? `${customRoles} custom, the rest defined in code.`
                    : 'All built-in; no custom roles yet.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl">{roles?.length ?? '—'}</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/permissions">
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Permissions
                </CardTitle>
                <CardDescription>
                  The closed catalog roles are composed from.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl">{permissions?.length ?? '—'}</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  )
}

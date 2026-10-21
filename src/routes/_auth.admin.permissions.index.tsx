import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import {
  listPermissionsOptions,
  listRolesOptions,
} from '@/client/@tanstack/react-query.gen'
import { ErrorState } from '@/components/error-state'
import { FullscreenSpinner } from '@/components/spinner'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { RISK_BADGE_VARIANT, RISK_ORDER, permissionResource } from '@/lib/permissions'

export const Route = createFileRoute('/_auth/admin/permissions/')({
  component: RouteComponent,
})

/**
 * The permission catalog as a reference page.
 *
 * This is what makes the role editor legible: 57 permissions across 18
 * resources is not memorisable, and the question people arrive with is usually
 * the reverse one — "which roles can delete a sample" — which no other page
 * answers.
 */
function RouteComponent() {
  const { data: catalog, error, refetch } = useQuery(listPermissionsOptions())
  const { data: roles } = useQuery(listRolesOptions())

  const [filter, setFilter] = useState('')
  const [risk, setRisk] = useState<string>('any')

  // Reversed from the roles' own permission lists, which is the only place this
  // mapping exists: the API has no "who holds this permission" endpoint, and
  // the role list already carries everything needed to derive it.
  const rolesByPermission = useMemo(() => {
    const map = new Map<string, Array<string>>()
    for (const role of roles ?? []) {
      for (const permission of role.permissions) {
        const bucket = map.get(permission)
        if (bucket) bucket.push(role.name)
        else map.set(permission, [role.name])
      }
    }
    return map
  }, [roles])

  const rows = useMemo(() => {
    const needle = filter.trim().toLowerCase()
    return (catalog ?? []).filter((entry) => {
      if (risk !== 'any' && entry.risk !== risk) return false
      if (!needle) return true
      return (
        entry.permission.toLowerCase().includes(needle) ||
        entry.description.toLowerCase().includes(needle)
      )
    })
  }, [catalog, filter, risk])

  if (error) return <ErrorState error={error} onRetry={() => { void refetch() }} />
  if (!catalog) return <FullscreenSpinner variant="ellipsis" />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl">Permissions</h1>
        <p className="text-muted-foreground">
          Every permission the API recognises. This is a closed set defined in
          code: a permission only means something if a route checks it, so it
          cannot be invented here — compose roles from it instead.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="admin-permissions-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter by permission or description"
            className="pl-8"
          />
        </div>
        <Select value={risk} onValueChange={setRisk}>
          <SelectTrigger id="admin-permissions-risk-filter" className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any risk</SelectItem>
            {RISK_ORDER.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {rows.length} of {catalog.length}
        </span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Permission</TableHead>
            <TableHead>Resource</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead>Scope</TableHead>
            <TableHead>Held by</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((entry) => (
            <TableRow key={entry.permission}>
              <TableCell className="font-mono text-xs">{entry.permission}</TableCell>
              <TableCell className="text-sm capitalize">
                {permissionResource(entry.permission)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {entry.description}
              </TableCell>
              <TableCell>
                <Badge variant={RISK_BADGE_VARIANT[entry.risk] ?? 'outline'}>
                  {entry.risk}
                </Badge>
              </TableCell>
              <TableCell>
                {entry.project_scopable ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary">project or global</Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Can be granted by a project role, applying to that
                        project only, or by a global role, applying everywhere.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-muted-foreground">
                        global only
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        The resource does not belong to a project, so a project
                        role could never honour it.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {(rolesByPermission.get(entry.permission) ?? []).map((roleName) => (
                    <Badge key={roleName} variant="outline" asChild>
                      <Link to="/admin/roles/$name" params={{ name: roleName }}>
                        {roleName}
                      </Link>
                    </Badge>
                  ))}
                  {(rolesByPermission.get(entry.permission) ?? []).length === 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs text-muted-foreground">No role</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Only superusers hold this. Worth knowing: it means the
                          routes behind it are effectively superuser-only.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { PermissionPublic } from '@/client'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { RISK_BADGE_VARIANT, groupByResource, permissionAction } from '@/lib/permissions'

interface PermissionMatrixProps {
  /** The catalog, from GET /rbac/permissions. */
  catalog: Array<PermissionPublic>
  /** Permission names currently held. */
  selected: Array<string>
  /** Omit to render read-only. */
  onChange?: (next: Array<string>) => void
  /**
   * Restrict to permissions a project-scoped role may hold. The server rejects
   * the rest with a 422, so offering them would be offering a mistake.
   */
  projectScopableOnly?: boolean
  /** Hide everything not selected. For read-only views of a large catalog. */
  selectedOnly?: boolean
  idPrefix?: string
}

/**
 * The permission catalog as a grid, grouped by resource.
 *
 * 57 permissions across 18 resources is not a readable flat list, and the
 * resource is how the question is actually asked ("what can this role do to
 * samples"). Each row carries its risk, because "grant everything the auditor
 * has" and "grant setting:update" are not decisions of the same size.
 */
export const PermissionMatrix = ({
  catalog,
  selected,
  onChange,
  projectScopableOnly = false,
  selectedOnly = false,
  idPrefix = 'permission-matrix',
}: PermissionMatrixProps) => {
  const [filter, setFilter] = useState('')
  const held = useMemo(() => new Set(selected), [selected])
  const readOnly = onChange === undefined

  const groups = useMemo(() => {
    const needle = filter.trim().toLowerCase()
    const visible = catalog.filter((entry) => {
      if (projectScopableOnly && !entry.project_scopable) return false
      if (selectedOnly && !held.has(entry.permission)) return false
      if (!needle) return true
      return (
        entry.permission.toLowerCase().includes(needle) ||
        entry.description.toLowerCase().includes(needle)
      )
    })
    return groupByResource(visible, (entry) => entry.permission)
  }, [catalog, filter, held, projectScopableOnly, selectedOnly])

  const toggle = (permission: string, next: boolean) => {
    if (!onChange) return
    onChange(next ? [...selected, permission] : selected.filter((p) => p !== permission))
  }

  const toggleResource = (permissions: Array<string>, next: boolean) => {
    if (!onChange) return
    onChange(
      next
        ? [...new Set([...selected, ...permissions])]
        : selected.filter((p) => !permissions.includes(p)),
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          id={`${idPrefix}-filter`}
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter permissions"
          className="pl-8"
        />
      </div>

      {groups.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {selectedOnly ? 'No permissions.' : 'No permissions match that filter.'}
        </p>
      )}

      {groups.map(([resource, entries]) => {
        const names = entries.map((entry) => entry.permission)
        const allHeld = names.every((name) => held.has(name))
        const someHeld = !allHeld && names.some((name) => held.has(name))

        return (
          <div key={resource} className="flex flex-col gap-2">
            <div className="flex items-center gap-2 border-b pb-1">
              {!readOnly && (
                <Checkbox
                  id={`${idPrefix}-${resource}-all`}
                  checked={allHeld ? true : someHeld ? 'indeterminate' : false}
                  onCheckedChange={(checked) => toggleResource(names, checked === true)}
                  aria-label={`Select every ${resource} permission`}
                />
              )}
              <h4 className="text-sm font-medium capitalize">{resource}</h4>
              <span className="text-xs text-muted-foreground">
                {names.filter((name) => held.has(name)).length} of {names.length}
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {entries.map((entry) => {
                const id = `${idPrefix}-${entry.permission.replace(/[^a-z0-9]+/gi, '-')}`
                return (
                  <div key={entry.permission} className="flex items-start gap-2">
                    {readOnly ? (
                      <span className="mt-0.5 h-4 w-4" aria-hidden />
                    ) : (
                      <Checkbox
                        id={id}
                        className="mt-0.5"
                        checked={held.has(entry.permission)}
                        onCheckedChange={(checked) => toggle(entry.permission, checked === true)}
                      />
                    )}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <Label htmlFor={readOnly ? undefined : id} className="font-mono text-xs">
                          {permissionAction(entry.permission)}
                        </Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant={RISK_BADGE_VARIANT[entry.risk] ?? 'outline'}>
                              {entry.risk}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{entry.permission}</p>
                          </TooltipContent>
                        </Tooltip>
                        {!entry.project_scopable && !projectScopableOnly && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="text-muted-foreground">
                                global only
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Cannot be granted by a project role, so it applies
                                platform-wide or not at all.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{entry.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

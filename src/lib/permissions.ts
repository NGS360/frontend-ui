/**
 * Which permissions mean something to the UI, and helpers for displaying them.
 *
 * The vocabulary itself is not here. `Permission` is generated from the OpenAPI
 * schema, so call sites write the permission as a literal and the compiler
 * checks it against the API's own 57 -- a rename server-side fails the build
 * rather than silently never matching. This file once mirrored a subset of
 * those names; that mirror was deleted once the generated union made it
 * redundant, descriptions and all, since GET /rbac/permissions already serves
 * them.
 *
 * What is left is the part the API has no opinion on: which permission opens
 * which admin section, and how to order, group and label them on screen.
 *
 * Gating in this app is advisory. The server is the enforcement point, and
 * deploy.sh ships the SPA and the API in one artifact, so a stale UI must never
 * be the thing standing between a caller and an action.
 *
 * Project-scoped permissions are answered by the project, not by GET /rbac/me.
 * That endpoint carries the global plane only -- with a five-figure project
 * count the payload would be unbounded -- so the project detail response
 * carries a `permissions` list for the project in hand instead. Check those
 * with useProjectAccess, never with useMyAccess: a global grant of
 * `project:manage_members` would say yes for every project, and a project
 * grant would not appear on /rbac/me at all, so asking the wrong one hides
 * the control from exactly the project owner it exists for.
 */

import type { Permission } from '@/client'


/**
 * Every permission that opens some part of the admin area.
 *
 * The shell allows a caller holding any one of them, and each section then
 * checks its own. Listed here so the shell's guard cannot drift out of step
 * with the sidebar: a section added to one and not the other would either be
 * unreachable or reachable by someone with nothing to do there.
 *
 * One entry per sidebar section, so `user:manage` is deliberately absent: it
 * gates the switches on a user's detail page, not a section, and listing it
 * here let a caller holding only that permission through to a panel whose every
 * section then filtered itself out.
 */
export const ADMIN_SECTION_PERMISSIONS = [
  'role:read',
  'vendor:create',
  'setting:update',
  'job:read_all',
] as const satisfies ReadonlyArray<Permission>

/**
 * Any permission the API recognises, not just the ones named above.
 *
 * A thin alias of the generated union, kept so signatures read as "a
 * permission" rather than as a 57-member type, and so this name survives if
 * the generator's ever changes.
 */
export type PermissionName = Permission

/** Risk levels, ordered by severity, as GET /rbac/permissions reports them. */
export const RISK_ORDER = ['low', 'medium', 'high', 'critical'] as const

export type Risk = (typeof RISK_ORDER)[number]

/**
 * Badge styling per risk level.
 *
 * `critical` is the destructive variant because those permissions are the ones
 * that rewrite platform settings, or that are the grant plane itself.
 */
export const RISK_BADGE_VARIANT: Record<string, 'secondary' | 'outline' | 'default' | 'destructive'> = {
  low: 'secondary',
  medium: 'outline',
  high: 'default',
  critical: 'destructive',
}

/** The resource half of a permission name: 'project:read' -> 'project'. */
export function permissionResource(permission: string): string {
  const [resource] = permission.split(':')
  return resource
}

/** The action half: 'project:manage_members' -> 'manage_members'. */
export function permissionAction(permission: string): string {
  const colon = permission.indexOf(':')
  return colon === -1 ? permission : permission.slice(colon + 1)
}

/**
 * Group permission names by resource, resources alphabetical.
 *
 * 57 permissions across 18 resources is not a readable flat list, and the
 * resource is how people actually look for one ("what can this role do to
 * samples").
 */
export function groupByResource<T>(
  items: Array<T>,
  nameOf: (item: T) => string,
): Array<[string, Array<T>]> {
  const groups = new Map<string, Array<T>>()
  for (const item of items) {
    const resource = permissionResource(nameOf(item))
    const bucket = groups.get(resource)
    if (bucket) bucket.push(item)
    else groups.set(resource, [item])
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
}

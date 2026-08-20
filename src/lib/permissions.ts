/**
 * The permission vocabulary the UI references, and helpers for displaying it.
 *
 * The API's catalog is the authority — GET /rbac/permissions serves all 57 —
 * and this file is deliberately not a copy of it. It names only the permissions
 * the UI itself branches on, so that a rename shows up as a compile error in
 * one place rather than as a string literal that silently stops matching.
 *
 * Gating in this app is advisory. The server is the enforcement point, and
 * deploy.sh ships the SPA and the API in one artifact, so a stale UI must never
 * be the thing standing between a caller and an action.
 */

export const PERMISSIONS = {
  /** View roles, permissions and grants. */
  ROLE_READ: 'role:read',
  /** Create and edit roles, grant and revoke them. */
  ROLE_MANAGE: 'role:manage',
  /** Search the user directory. */
  USER_READ: 'user:read',
  /** Activate, verify and set superuser on users. */
  USER_MANAGE: 'user:manage',
  /** Add, change and remove project members. Project-scoped. */
  PROJECT_MANAGE_MEMBERS: 'project:manage_members',
  /** Create a vendor. Stands in for the vendors admin page as a whole. */
  VENDOR_CREATE: 'vendor:create',
  /** Change platform settings. Gates both settings pages. */
  SETTING_UPDATE: 'setting:update',
  /** View all users' jobs rather than only your own. */
  JOB_READ_ALL: 'job:read_all',
} as const

/**
 * Every permission that opens some part of the admin area.
 *
 * The shell allows a caller holding any one of them, and each section then
 * checks its own. Listed here so the shell's guard cannot drift out of step
 * with the sidebar: a section added to one and not the other would either be
 * unreachable or reachable by someone with nothing to do there.
 */
export const ADMIN_SECTION_PERMISSIONS = [
  PERMISSIONS.ROLE_READ,
  PERMISSIONS.USER_MANAGE,
  PERMISSIONS.VENDOR_CREATE,
  PERMISSIONS.SETTING_UPDATE,
  PERMISSIONS.JOB_READ_ALL,
] as const

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

/** Risk levels, ordered by severity, as GET /rbac/permissions reports them. */
export const RISK_ORDER = ['low', 'medium', 'high', 'critical'] as const

export type Risk = (typeof RISK_ORDER)[number]

/**
 * Badge styling per risk level.
 *
 * `critical` is the destructive variant because those permissions are the ones
 * the API refuses to let through even in dry-run mode: they rewrite platform
 * settings, or they are the grant plane itself.
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

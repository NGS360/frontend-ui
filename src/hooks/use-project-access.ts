import type { ProjectPublic } from '@/client'
import type { PermissionName } from '@/lib/permissions'

/**
 * What the calling user may do in one project.
 *
 * The project plane's counterpart to useMyAccess, and a separate hook rather
 * than an argument to it because the two read different sources and cannot be
 * substituted for each other. Project grants never appear on GET /rbac/me, and
 * a global grant of a project-scopable permission applies to every project, so
 * asking useMyAccess about `project:manage_members` gets the wrong answer in
 * both directions -- see lib/permissions.ts.
 *
 * Takes the project rather than an id, and needs no query of its own: the
 * project detail response already carries `permissions`, and
 * _auth.projects.$project_id.route.tsx fetches it on every project page, so
 * every child route has the answer without a second request.
 *
 * Advisory, like the global check. The server is the enforcement point.
 */

/**
 * The permissions this caller holds in the project, or undefined if unknown.
 *
 * Undefined covers three cases that all have to deny: the project has not
 * loaded, the list routes left the field unset, and the detail route left it
 * null because the request was anonymous. Held separately from "holds nothing"
 * so a control cannot render on a guess and then be taken away.
 */
function heldIn(project: ProjectPublic | undefined): Array<string> | undefined {
  return project?.permissions ?? undefined
}

/** Whether every named permission is held in this project. */
export function hasProjectPermission(
  project: ProjectPublic | undefined,
  ...permissions: Array<PermissionName>
): boolean {
  const held = heldIn(project)
  if (!held) return false
  return permissions.every((p) => held.includes(p))
}

/** Whether at least one of them is. */
export function hasAnyProjectPermission(
  project: ProjectPublic | undefined,
  ...permissions: Array<PermissionName>
): boolean {
  const held = heldIn(project)
  if (!held) return false
  return permissions.some((p) => held.includes(p))
}

export function useProjectAccess(project: ProjectPublic | undefined) {
  return {
    permissions: heldIn(project),
    /** True only when every named permission is held in this project. */
    can: (...permissions: Array<PermissionName>) =>
      hasProjectPermission(project, ...permissions),
    /** True when any one of them is. */
    canAny: (...permissions: Array<PermissionName>) =>
      hasAnyProjectPermission(project, ...permissions),
  }
}

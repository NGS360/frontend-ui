import { useQuery } from '@tanstack/react-query'
import type { MyAccessPublic } from '@/client'
import type { PermissionName } from '@/lib/permissions'
import { getMyAccessOptions } from '@/client/@tanstack/react-query.gen'

/**
 * The caller's own effective access, from GET /rbac/me.
 *
 * Replaces reading `is_superuser` off the user profile as the way to decide
 * what to render. Superuser is kept as an implicit allow — it short-circuits
 * every check server-side, so a UI that ignored it would hide controls from the
 * one account that certainly has them — but it is no longer the only way in.
 *
 * Cached for five minutes like the user profile: grants change rarely, and both
 * are fetched on nearly every page. Revocation is immediate server-side, so a
 * stale cache can only ever mean a control renders and then the request is
 * refused, which is the safe direction for an advisory check to be wrong in.
 */
export const myAccessQueryOptions = () => ({
  ...getMyAccessOptions(),
  staleTime: 5 * 60 * 1000,
})

/**
 * Whether an access payload carries a permission. Superuser holds everything.
 *
 * Takes PermissionName rather than string so that a literal is not an option:
 * `hasPermission(access, 'role:raed')` has to be a compile error, or naming the
 * permissions in one place buys nothing. Renaming an entry in PERMISSIONS then
 * fails the build at every call site instead of silently matching nothing --
 * which, because a missing permission hides a control, is otherwise invisible.
 */
export function hasPermission(
  access: MyAccessPublic | undefined,
  ...permissions: Array<PermissionName>
): boolean {
  if (!access) return false
  if (access.is_superuser) return true
  return permissions.every((p) => access.global_permissions.includes(p))
}

/** Whether it carries at least one of them. */
export function hasAnyPermission(
  access: MyAccessPublic | undefined,
  ...permissions: Array<PermissionName>
): boolean {
  if (!access) return false
  if (access.is_superuser) return true
  return permissions.some((p) => access.global_permissions.includes(p))
}

export function useMyAccess() {
  const query = useQuery(myAccessQueryOptions())
  const access = query.data

  return {
    ...query,
    access,
    isSuperuser: access?.is_superuser ?? false,
    /** True only when every named permission is held. */
    can: (...permissions: Array<PermissionName>) => hasPermission(access, ...permissions),
    /** True when any one of them is. */
    canAny: (...permissions: Array<PermissionName>) =>
      hasAnyPermission(access, ...permissions),
  }
}

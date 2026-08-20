import { useQuery } from '@tanstack/react-query'
import type { MyAccessPublic } from '@/client'
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

/** Whether an access payload carries a permission. Superuser holds everything. */
export function hasPermission(
  access: MyAccessPublic | undefined,
  ...permissions: Array<string>
): boolean {
  if (!access) return false
  if (access.is_superuser) return true
  return permissions.every((p) => access.global_permissions.includes(p))
}

/** Whether it carries at least one of them. */
export function hasAnyPermission(
  access: MyAccessPublic | undefined,
  ...permissions: Array<string>
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
    can: (...permissions: Array<string>) => hasPermission(access, ...permissions),
    /** True when any one of them is. */
    canAny: (...permissions: Array<string>) => hasAnyPermission(access, ...permissions),
  }
}

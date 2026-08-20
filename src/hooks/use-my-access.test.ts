import { describe, expect, it } from 'vitest'

import { hasAnyPermission, hasPermission } from './use-my-access'
import type { MyAccessPublic } from '@/client'

function access(overrides: Partial<MyAccessPublic> = {}): MyAccessPublic {
  return {
    username: 'testuser',
    is_superuser: false,
    global_roles: ['member'],
    global_permissions: ['project:read', 'sample:read'],
    ...overrides,
  }
}

describe('hasPermission', () => {
  it('is true for a permission the caller holds', () => {
    expect(hasPermission(access(), 'project:read')).toBe(true)
  })

  it('is false for one they do not', () => {
    expect(hasPermission(access(), 'role:manage')).toBe(false)
  })

  it('requires every permission named, not just one', () => {
    expect(hasPermission(access(), 'project:read', 'role:manage')).toBe(false)
  })

  it('lets a superuser through regardless', () => {
    // Superuser short-circuits ahead of every role on the server too, so a UI
    // that ignored the flag would hide controls from the one account that
    // certainly may use them.
    expect(hasPermission(access({ is_superuser: true, global_permissions: [] }), 'role:manage')).toBe(true)
  })

  it('is false while access is still loading', () => {
    // Undefined means "not known yet". Defaulting to true would flash controls
    // on screen and then take them away.
    expect(hasPermission(undefined, 'project:read')).toBe(false)
  })
})

describe('hasAnyPermission', () => {
  it('is true when one of several is held', () => {
    expect(hasAnyPermission(access(), 'role:manage', 'sample:read')).toBe(true)
  })

  it('is false when none is', () => {
    expect(hasAnyPermission(access(), 'role:manage', 'user:manage')).toBe(false)
  })

  it('is false with nothing named, rather than vacuously true', () => {
    // The opposite of hasPermission's every(), and deliberately: an admin shell
    // guarded by an empty permission list should admit nobody, not everybody.
    expect(hasAnyPermission(access())).toBe(false)
  })

  it('lets a superuser through regardless', () => {
    expect(hasAnyPermission(access({ is_superuser: true }), 'role:manage')).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'

import { hasAnyPermission, hasPermission } from './use-my-access'
import type { MyAccessPublic } from '@/client'
import { PERMISSIONS } from '@/lib/permissions'

function access(overrides: Partial<MyAccessPublic> = {}): MyAccessPublic {
  return {
    username: 'testuser',
    is_superuser: false,
    global_roles: ['member'],
    global_permissions: [PERMISSIONS.VENDOR_CREATE, PERMISSIONS.JOB_READ_ALL],
    ...overrides,
  }
}

describe('hasPermission', () => {
  it('is true for a permission the caller holds', () => {
    expect(hasPermission(access(), PERMISSIONS.VENDOR_CREATE)).toBe(true)
  })

  it('is false for one they do not', () => {
    expect(hasPermission(access(), PERMISSIONS.ROLE_MANAGE)).toBe(false)
  })

  it('requires every permission named, not just one', () => {
    expect(hasPermission(access(), PERMISSIONS.VENDOR_CREATE, PERMISSIONS.ROLE_MANAGE)).toBe(false)
  })

  it('lets a superuser through regardless', () => {
    // Superuser short-circuits ahead of every role on the server too, so a UI
    // that ignored the flag would hide controls from the one account that
    // certainly may use them.
    expect(hasPermission(access({ is_superuser: true, global_permissions: [] }), PERMISSIONS.ROLE_MANAGE)).toBe(true)
  })

  it('is false while access is still loading', () => {
    // Undefined means "not known yet". Defaulting to true would flash controls
    // on screen and then take them away.
    expect(hasPermission(undefined, PERMISSIONS.VENDOR_CREATE)).toBe(false)
  })
})

describe('hasAnyPermission', () => {
  it('is true when one of several is held', () => {
    expect(hasAnyPermission(access(), PERMISSIONS.ROLE_MANAGE, PERMISSIONS.JOB_READ_ALL)).toBe(true)
  })

  it('is false when none is', () => {
    expect(hasAnyPermission(access(), PERMISSIONS.ROLE_MANAGE, PERMISSIONS.USER_MANAGE)).toBe(false)
  })

  it('is false with nothing named, rather than vacuously true', () => {
    // The opposite of hasPermission's every(), and deliberately: an admin shell
    // guarded by an empty permission list should admit nobody, not everybody.
    expect(hasAnyPermission(access())).toBe(false)
  })

  it('lets a superuser through regardless', () => {
    expect(hasAnyPermission(access({ is_superuser: true }), PERMISSIONS.ROLE_MANAGE)).toBe(true)
  })
})

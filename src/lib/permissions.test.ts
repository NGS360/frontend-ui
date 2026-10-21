import { describe, expect, it } from 'vitest'

import { groupByResource, permissionAction, permissionResource } from './permissions'

describe('permissionResource', () => {
  it('takes the resource half', () => {
    expect(permissionResource('sample:read')).toBe('sample')
  })

  it('leaves a bare name alone rather than returning empty', () => {
    // Nothing in the catalog looks like this, but a display helper that returns
    // '' for unexpected input renders a blank row instead of the odd value.
    expect(permissionResource('legacy')).toBe('legacy')
  })
})

describe('permissionAction', () => {
  it('takes the action half', () => {
    expect(permissionAction('sample:read')).toBe('read')
  })

  it('keeps underscores in a compound action', () => {
    expect(permissionAction('project:manage_members')).toBe('manage_members')
  })

  it('returns the whole string when there is no colon', () => {
    expect(permissionAction('legacy')).toBe('legacy')
  })
})

describe('groupByResource', () => {
  it('groups by the resource half, resources alphabetical', () => {
    const grouped = groupByResource(
      ['sample:read', 'file:read', 'sample:create'],
      (name) => name,
    )
    expect(grouped.map(([resource]) => resource)).toEqual(['file', 'sample'])
  })

  it('preserves the input order inside a group', () => {
    // The catalog arrives sorted, and re-sorting within a resource would put
    // ':create' before ':read' for no reason anyone reading the page wants.
    const grouped = groupByResource(
      ['sample:read', 'sample:create', 'sample:delete'],
      (name) => name,
    )
    expect(grouped[0][1]).toEqual(['sample:read', 'sample:create', 'sample:delete'])
  })

  it('handles an empty list', () => {
    expect(groupByResource([], (name: string) => name)).toEqual([])
  })
})

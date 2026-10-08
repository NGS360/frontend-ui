import { describe, expect, it } from 'vitest'

import { hasAnyProjectPermission, hasProjectPermission } from './use-project-access'
import type { ProjectPublic } from '@/client'
import { PERMISSIONS } from '@/lib/permissions'

function project(overrides: Partial<ProjectPublic> = {}): ProjectPublic {
  return {
    project_id: 'P-19900109-0001',
    name: 'Test Project',
    created_by: 'someone',
    created_at: null,
    last_modified: null,
    data_folder_uri: null,
    results_folder_uri: null,
    attributes: null,
    permissions: [PERMISSIONS.SAMPLE_CREATE, PERMISSIONS.PROJECT_INGEST],
    ...overrides,
  }
}

describe('hasProjectPermission', () => {
  it('is true for a permission held in this project', () => {
    expect(hasProjectPermission(project(), PERMISSIONS.SAMPLE_CREATE)).toBe(true)
  })

  it('is false for one that is not', () => {
    expect(
      hasProjectPermission(project(), PERMISSIONS.PROJECT_MANAGE_MEMBERS),
    ).toBe(false)
  })

  it('requires every permission named', () => {
    expect(
      hasProjectPermission(
        project(),
        PERMISSIONS.SAMPLE_CREATE,
        PERMISSIONS.PROJECT_MANAGE_MEMBERS,
      ),
    ).toBe(false)
  })

  it('is false while the project is still loading', () => {
    // Undefined means "not known yet". Defaulting to true would flash controls
    // on screen and then take them away.
    expect(hasProjectPermission(undefined, PERMISSIONS.SAMPLE_CREATE)).toBe(false)
  })

  it('is false when the field was never populated', () => {
    // The list routes leave it unset and the detail route leaves it null for an
    // anonymous caller. Neither is evidence of access.
    expect(
      hasProjectPermission(project({ permissions: null }), PERMISSIONS.SAMPLE_CREATE),
    ).toBe(false)
  })

  it('distinguishes holding nothing from not knowing', () => {
    // Both deny, but an empty list is a real answer -- the caller was evaluated.
    expect(
      hasProjectPermission(project({ permissions: [] }), PERMISSIONS.SAMPLE_CREATE),
    ).toBe(false)
  })

  it('does not consult the global plane', () => {
    // A global grant that applies to this project arrives *in* this list,
    // because the server resolves it with has_in_project. Nothing here should
    // fall back to /rbac/me: doing so would answer yes for every project.
    expect(
      hasProjectPermission(project({ permissions: [] }), PERMISSIONS.PROJECT_INGEST),
    ).toBe(false)
  })
})

describe('hasAnyProjectPermission', () => {
  it('is true when one of several is held', () => {
    expect(
      hasAnyProjectPermission(
        project(),
        PERMISSIONS.PROJECT_MANAGE_MEMBERS,
        PERMISSIONS.SAMPLE_CREATE,
      ),
    ).toBe(true)
  })

  it('is false when none is', () => {
    expect(
      hasAnyProjectPermission(
        project(),
        PERMISSIONS.PROJECT_MANAGE_MEMBERS,
        PERMISSIONS.PROJECT_SUBMIT_ACTION,
      ),
    ).toBe(false)
  })

  it('is false with nothing named, rather than vacuously true', () => {
    expect(hasAnyProjectPermission(project())).toBe(false)
  })
})

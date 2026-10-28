import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'

import {
  useColumnVisibilityStore,
  useProjectColumnVisibility,
} from './column-visibility-store'

// The project route is not remounted when its project_id param changes, so the
// hook has to follow the id it is given rather than the one it first saw.
// Getting that wrong does not only show the previous project's columns: the
// old sync effect also wrote them into the new project's entry, destroying a
// choice the user had made there.
beforeEach(() => {
  useColumnVisibilityStore.getState().clearAll()
})

const PROJECT_A = 'P-19900109-0001'
const PROJECT_B = 'P-19900109-0002'

describe('useProjectColumnVisibility', () => {
  it('follows the project it is given', () => {
    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useProjectColumnVisibility(id),
      { initialProps: { id: PROJECT_A } },
    )

    act(() => { result.current[1]({ sample_name: false }) })
    expect(result.current[0]).toEqual({ sample_name: false })

    rerender({ id: PROJECT_B })
    expect(result.current[0]).toEqual({})
  })

  it('does not overwrite the other project while being read', () => {
    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useProjectColumnVisibility(id),
      { initialProps: { id: PROJECT_B } },
    )

    act(() => { result.current[1]({ created_at: false }) })

    // Visit A, hide something else there, and come back.
    rerender({ id: PROJECT_A })
    act(() => { result.current[1]({ sample_name: false }) })
    rerender({ id: PROJECT_B })

    expect(result.current[0]).toEqual({ created_at: false })
    expect(useColumnVisibilityStore.getState().getVisibility(PROJECT_A))
      .toEqual({ sample_name: false })
  })

  it('accepts the updater form the table calls it with', () => {
    const { result } = renderHook(() => useProjectColumnVisibility(PROJECT_A))

    act(() => { result.current[1]({ sample_name: false }) })
    act(() => { result.current[1]((prev) => ({ ...prev, created_at: false })) })

    expect(result.current[0]).toEqual({ sample_name: false, created_at: false })
  })
})

import { useCallback } from 'react'
import { create } from 'zustand'
import type { OnChangeFn } from '@tanstack/react-table'

/**
 * Column visibility state type for TanStack Table
 * Key: column id, Value: true (visible) or false (hidden)
 */
type ColumnVisibilityState = Record<string, boolean>

/**
 * Store state interface
 */
interface ColumnVisibilityStore {
  /**
   * Map of project IDs to their column visibility states
   */
  visibilityByProject: Record<string, ColumnVisibilityState>
  
  /**
   * Get the column visibility state for a specific project
   * @param projectId - The project ID
   * @returns The column visibility state, or undefined if not set
   */
  getVisibility: (projectId: string) => ColumnVisibilityState | undefined
  
  /**
   * Set the column visibility state for a specific project
   * @param projectId - The project ID
   * @param visibility - The column visibility state to set
   */
  setVisibility: (projectId: string, visibility: ColumnVisibilityState) => void
  
  /**
   * Clear the column visibility state for a specific project
   * @param projectId - The project ID
   */
  clearVisibility: (projectId: string) => void
  
  /**
   * Clear all column visibility states
   */
  clearAll: () => void
}

/** A project with nothing hidden has no entry; a fresh object here would loop. */
const NOTHING_HIDDEN: ColumnVisibilityState = {}

/**
 * Zustand store for managing column visibility across projects
 * State persists in memory during the user's session but is cleared on page refresh
 */
export const useColumnVisibilityStore = create<ColumnVisibilityStore>((set, get) => ({
  visibilityByProject: {},
  
  getVisibility: (projectId: string) => {
    return get().visibilityByProject[projectId]
  },
  
  setVisibility: (projectId: string, visibility: ColumnVisibilityState) => {
    set((state) => ({
      visibilityByProject: {
        ...state.visibilityByProject,
        [projectId]: visibility
      }
    }))
  },
  
  clearVisibility: (projectId: string) => {
    set((state) => {
      const { [projectId]: _, ...rest } = state.visibilityByProject
      return { visibilityByProject: rest }
    })
  },
  
  clearAll: () => {
    set({ visibilityByProject: {} })
  }
}))

/**
 * A project's column visibility, in the shape TanStack Table expects.
 *
 * Reads straight from the store rather than copying into local state: the
 * project route is not remounted when its project_id changes, so a copy taken
 * on mount would go on describing the project the user arrived from.
 */
export function useProjectColumnVisibility(
  projectId: string,
): [ColumnVisibilityState, OnChangeFn<ColumnVisibilityState>] {
  const visibility = useColumnVisibilityStore(
    (state) => state.visibilityByProject[projectId] ?? NOTHING_HIDDEN
  )
  const setVisibility = useColumnVisibilityStore((state) => state.setVisibility)

  const setColumnVisibility = useCallback<OnChangeFn<ColumnVisibilityState>>(
    (updater) => {
      setVisibility(
        projectId,
        typeof updater === 'function' ? updater(visibility) : updater
      )
    },
    [projectId, visibility, setVisibility]
  )

  return [visibility, setColumnVisibility]
}

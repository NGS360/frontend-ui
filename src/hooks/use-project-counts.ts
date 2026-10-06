/**
 * Totals for the project page's tab labels.
 *
 * The samples and jobs tables live in sibling child routes, so only the
 * active one is mounted -- neither can report its own total up to the tab
 * strip the way the old accordions did. These ask the endpoints the tables
 * already use for a single row and read the total off the response envelope.
 * No new endpoint, and the payload is one record rather than a page.
 */

import { useQuery } from '@tanstack/react-query'
import { getJobs, getProjectSamples } from '@/client'

/** One row is the smallest page that still carries the total. */
const COUNT_ONLY = { skip: 0, limit: 1 } as const

/** Five minutes, matching the samples table's own staleTime. */
const COUNT_STALE_TIME = 5 * 60 * 1000

/**
 * Deliberately a prefix of the samples table's own key, so the upload
 * mutation's `invalidateQueries(['samples', 'all', projectId])` refreshes the
 * tab label along with the table.
 */
export const projectSampleCountQueryKey = (projectId: string) =>
  ['samples', 'all', projectId, 'count'] as const

/** Exported so the jobs table's Refresh can invalidate the label it feeds. */
export const projectJobCountQueryKey = (projectId: string) =>
  ['jobs', 'project', projectId, 'count'] as const

export function useProjectSampleCount(projectId: string) {
  const { data } = useQuery({
    queryKey: projectSampleCountQueryKey(projectId),
    queryFn: async () => {
      const response = await getProjectSamples({
        path: { project_id: projectId },
        query: COUNT_ONLY,
        throwOnError: true,
      })
      return response.data.total_items
    },
    staleTime: COUNT_STALE_TIME,
  })
  return data
}

export function useProjectJobCount(projectId: string) {
  const { data } = useQuery({
    queryKey: projectJobCountQueryKey(projectId),
    queryFn: async () => {
      const response = await getJobs({
        query: { project_id: projectId, ...COUNT_ONLY },
        throwOnError: true,
      })
      return response.data.count
    },
    staleTime: COUNT_STALE_TIME,
  })
  return data
}

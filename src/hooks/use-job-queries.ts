/**
 * Shared query options for job-related queries
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { 
  getJobQueryKey, 
  getJobsQueryKey, 
  updateJobMutation 
} from '@/client/@tanstack/react-query.gen'

/** Default query options for fetching jobs list */
export const DEFAULT_JOBS_QUERY_OPTIONS = {
  query: {
    user: 'system',
    limit: 10,
    sort_by: 'submitted_on',
    sort_order: 'desc',
  },
} as const;

/**
 * Custom hook to handle viewing a job (marking as viewed and navigating)
 * Centralizes the logic for updating job viewed status and invalidating queries
 */
export function useViewJob() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const updateJobMutationInstance = useMutation({
    ...updateJobMutation(),
    onSuccess: (_data, variables) => {
      // Invalidate the jobs list query with default options
      const jobsQueryKey = getJobsQueryKey(DEFAULT_JOBS_QUERY_OPTIONS)
      queryClient.invalidateQueries({ queryKey: jobsQueryKey, refetchType: 'all' })
      
      // Invalidate the specific job query
      const jobQueryKey = getJobQueryKey({
        path: { job_id: variables.path.job_id },
      })
      queryClient.invalidateQueries({ queryKey: jobQueryKey, refetchType: 'all' })
    },
  })

  /**
   * Mark a job as viewed and navigate to its details page
   * @param jobId - The ID of the job to view
   * @param additionalQueryKeysToInvalidate - Optional additional query keys to invalidate
   */
  const viewJob = async (jobId: string, additionalQueryKeysToInvalidate?: Array<ReadonlyArray<unknown>>) => {
    // Update job status to viewed
    await updateJobMutationInstance.mutateAsync({
      path: { job_id: jobId },
      body: { viewed: true },
    })

    // Invalidate any additional query keys if provided
    if (additionalQueryKeysToInvalidate) {
      for (const queryKey of additionalQueryKeysToInvalidate) {
        queryClient.invalidateQueries({ queryKey, refetchType: 'all' })
      }
    }

    // Navigate to job details
    navigate({ to: '/jobs/$job_id', params: { job_id: jobId } })
  }

  return {
    viewJob,
    isUpdating: updateJobMutationInstance.isPending,
  }
}


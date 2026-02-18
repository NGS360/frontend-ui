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

interface InvalidateJobQueriesOptions {
  jobId?: string
  additionalQueryKeysToInvalidate?: Array<ReadonlyArray<unknown>>
}

/**
 * Shared helper to invalidate job-related queries.
 * Invalidates all jobs list variants plus optional job/details and additional keys.
 */
export function useInvalidateJobQueries() {
  const queryClient = useQueryClient()

  const invalidateJobQueries = ({
    jobId,
    additionalQueryKeysToInvalidate,
  }: InvalidateJobQueriesOptions = {}) => {
    queryClient.invalidateQueries({ queryKey: getJobsQueryKey(), refetchType: 'all' })

    if (jobId) {
      const jobQueryKey = getJobQueryKey({
        path: { job_id: jobId },
      })
      queryClient.invalidateQueries({ queryKey: jobQueryKey, refetchType: 'all' })
    }

    if (additionalQueryKeysToInvalidate) {
      for (const queryKey of additionalQueryKeysToInvalidate) {
        queryClient.invalidateQueries({ queryKey, refetchType: 'all' })
      }
    }
  }

  return {
    invalidateJobQueries,
  }
}

/**
 * Custom hook to handle viewing a job (marking as viewed and navigating)
 * Centralizes the logic for updating job viewed status and invalidating queries
 */
export function useViewJob() {
  const navigate = useNavigate()
  const { invalidateJobQueries } = useInvalidateJobQueries()

  const updateJobMutationInstance = useMutation({
    ...updateJobMutation(),
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

    invalidateJobQueries({
      jobId,
      additionalQueryKeysToInvalidate,
    })

    // Navigate to job details
    navigate({ to: '/jobs/$job_id', params: { job_id: jobId } })
  }

  return {
    viewJob,
    isUpdating: updateJobMutationInstance.isPending,
  }
}


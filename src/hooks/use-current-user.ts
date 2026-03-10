import { useQuery } from '@tanstack/react-query'
import { getCurrentUserInfoOptions } from '@/client/@tanstack/react-query.gen'

export const currentUserQueryOptions = () => ({
  ...getCurrentUserInfoOptions(),
  staleTime: 5 * 60 * 1000, // 5 minutes — user profile rarely changes mid-session
})

export function useCurrentUser() {
  return useQuery(currentUserQueryOptions())
}

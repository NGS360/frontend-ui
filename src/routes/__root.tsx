import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'

import type { QueryClient } from '@tanstack/react-query'
import type { UserPublic } from '@/client/types.gen'

interface AuthState {
  isAuthenticated: boolean
  user: UserPublic | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  basicLogin: (email: string, password: string) => Promise<void>
  oauthLogin: (provider: string, code: string, state: string, redirectUri: string) => Promise<void>
  logout: () => Promise<void>
}

interface MyRouterContext {
  queryClient: QueryClient
  auth: AuthState
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => <Outlet />,
})

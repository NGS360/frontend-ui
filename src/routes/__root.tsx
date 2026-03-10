import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'

import type { QueryClient } from '@tanstack/react-query'

interface AuthState {
  isAuthenticated: boolean
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

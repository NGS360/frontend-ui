import { createFileRoute, redirect } from '@tanstack/react-router'
import { consumePostLoginRedirect } from '@/lib/post-login-redirect'

// Module-level guard to prevent TanStack Router from replaying the single-use
// OAuth code when it re-evaluates beforeLoad due to auth context changes.
let exchangingCode: string | null = null
let pendingRedirectTo: string | null = null

export const Route = createFileRoute('/_user/oauth/$provider/callback')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      code: (search.code as string) || '',
      state: (search.state as string) || '',
    }
  },
  beforeLoad: async ({ params, search, context }) => {
    const { provider } = params
    const { code, state } = search

    if (!code || !state) {
      throw new Error('Missing authentication parameters')
    }

    if (code === exchangingCode) {
      throw redirect({ to: pendingRedirectTo || '/' })
    }

    exchangingCode = code
    pendingRedirectTo = consumePostLoginRedirect()

    try {
      const redirectUri = `${window.location.origin}/oauth/${provider}/callback`
      await context.auth.oauthLogin(provider, code, state, redirectUri)

      throw redirect({ to: pendingRedirectTo || '/' })
    } finally {
      exchangingCode = null
      pendingRedirectTo = null
    }
  },
  component: () => <div>Redirecting...</div>, // Never renders - beforeLoad always redirects
  errorComponent: OAuthErrorComponent,
})

function OAuthErrorComponent({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-md p-6 bg-destructive/10 rounded-lg border border-destructive">
        <h2 className="text-2xl font-bold text-destructive mb-4">
          Authentication Error
        </h2>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <a
          href="/login"
          className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Back to Login
        </a>
      </div>
    </div>
  )
}

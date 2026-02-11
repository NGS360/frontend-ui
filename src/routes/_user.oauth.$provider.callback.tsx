import { createFileRoute, redirect } from '@tanstack/react-router'

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

    try {
      const redirectUri = `${window.location.origin}/oauth/${provider}/callback`
      
      // Auth provider handles the API call and token storage
      await context.auth.oauthLogin(provider, code, state, redirectUri)
      
      // Redirect to the main app
      throw redirect({ to: '/' })
    } catch (err: any) {
      // If it's a redirect, re-throw it
      if (err.isRedirect) {
        throw err
      }
      
      // Otherwise, throw error for error component
      throw err
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

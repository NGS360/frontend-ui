import { useQuery } from '@tanstack/react-query'
import { getAvailableOauthProvidersOptions } from '@/client/@tanstack/react-query.gen'
import { LoginFormCorporate } from '@/components/login-form-corporate'
import { LoginFormDefault } from '@/components/login-form-default'

export function LoginForm() {
  const apiUrl = import.meta.env.VITE_API_URL.replace(/\/$/, '')
  const { data: oauthProviders } = useQuery(getAvailableOauthProvidersOptions())

  const handleOAuthLogin = (authorizeUrl: string) => {
    const redirectUri = `${window.location.origin}/oauth/github/callback`
    const separator = authorizeUrl.includes('?') ? '&' : '?'
    window.location.href = `${authorizeUrl}${separator}redirect_uri=${encodeURIComponent(redirectUri)}`
  }

  // Check for corporate SSO provider
  const corpProvider = oauthProviders?.providers.find((p) => p.name === 'corp')

  // Render corporate SSO login if corp provider exists
  if (corpProvider) {
    return (
      <LoginFormCorporate
        provider={corpProvider}
        onLogin={handleOAuthLogin}
        apiUrl={apiUrl}
      />
    )
  }

  // Otherwise render standard login form
  return (
    <LoginFormDefault
      oauthProviders={oauthProviders?.providers}
      onOAuthLogin={handleOAuthLogin}
      apiUrl={apiUrl}
    />
  )
}

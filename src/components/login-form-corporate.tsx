import type { OAuthProviderInfo } from '@/client/types.gen'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { NGS360Logo } from '@/components/ngs360-logo'

interface LoginFormCorporateProps {
  provider: OAuthProviderInfo
  onLogin: (authorizeUrl: string) => void
  apiUrl: string
}

export function LoginFormCorporate({ provider, onLogin, apiUrl }: LoginFormCorporateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary-2/5 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader></CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              {/* Logo and Title Section */}
              <div className="flex flex-col items-center gap-2 text-center">
                <NGS360Logo className="mb-2" />
                <h1 className="text-2xl font-bold">Login</h1>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Sign in with your corporate account to access NGS360.
                </p>
              </div>

              {/* Corporate SSO Button */}
              <Button
                type="button"
                onClick={() => onLogin(`${apiUrl}${provider.authorize_url}`)}
                className="flex items-center gap-2 w-full"
                size="lg"
              >
                {provider.logo_url && (
                  <img
                    src={`${apiUrl}${provider.logo_url}`}
                    alt={`${provider.display_name} logo`}
                    className="h-5 w-5"
                  />
                )}
                {provider.display_name}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} BMS NGS360. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

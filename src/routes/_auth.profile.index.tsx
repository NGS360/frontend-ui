import { createFileRoute } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { KeyRound, Mail, ShieldCheck } from 'lucide-react'
import { resendVerificationMutation } from '@/client/@tanstack/react-query.gen'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCurrentUser } from '@/hooks/use-current-user'
import { ChangePasswordForm } from '@/components/change-password-form'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { APIKeysSection } from '@/components/api-keys-section'

export const Route = createFileRoute('/_auth/profile/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: user } = useCurrentUser()

  // Resend verification email mutation
  const resendVerificationEmail = useMutation({
    ...resendVerificationMutation(),
    onSuccess: () => {
      toast.success('Verification email sent. Check your inbox.')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to send verification email. Please try again.')
    },
  })

  const handleResendVerification = () => {
    if (user?.email) {
      resendVerificationEmail.mutate({
        body: {
          email: user.email,
        },
      })
    }
  }

  return (
    <div className='flex flex-col gap-8 pb-8'>

      {/* User Info Section */}
      <section id="user-info" className="scroll-mt-20">
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <h1 className="text-3xl">Profile</h1>
            <p className="text-muted-foreground">
              Manage your account information and view your activities.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your NGS360 account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="text-sm">{user?.full_name || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{user?.email}</p>
                    {user?.is_verified ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <ShieldCheck className="h-4 w-4 text-green-600" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Email verified</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={handleResendVerification}
                            disabled={resendVerificationEmail.isPending}
                          >
                            <Mail className="h-4 w-4" />
                            <span className="sr-only">Resend verification email</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Resend verification email</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Username</p>
                  <p className="text-sm">{user?.username || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Role</p>
                  <p className="text-sm capitalize">{user?.is_superuser ? 'Administrator' : 'User'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-sm capitalize">{user?.is_active ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
              {(!user?.oauth_providers || user.oauth_providers.length === 0) && (
                <div className="pt-4 border-t">
                  <ChangePasswordForm
                    idPrefix="profile-change-password"
                    trigger={
                      <Button variant="outline" size="sm">
                        <KeyRound className="mr-2 h-4 w-4" />
                        Change Password
                      </Button>
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* API Keys Section */}
      <section id="api-keys" className="scroll-mt-20">
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <h1 className="text-3xl">API Keys</h1>
            <p className="text-muted-foreground">
              Manage API keys for programmatic access.
            </p>
          </div>

          <APIKeysSection />
        </div>
      </section>
    </div>
  )
}

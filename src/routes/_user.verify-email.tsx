import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { CheckCircle2, LoaderCircle, Mail, XCircle } from 'lucide-react'
import { verifyEmailMutation } from '@/client/@tanstack/react-query.gen'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Define the search schema for email verification
const verifyEmailSearchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute('/_user/verify-email')({
  component: RouteComponent,
  validateSearch: verifyEmailSearchSchema,
})

function RouteComponent() {
  const search = Route.useSearch()
  const { token } = search

  const { mutate, isPending, isSuccess, isError, error } = useMutation({
    ...verifyEmailMutation(),
  })

  const handleVerify = () => {
    if (token) {
      mutate({
        body: {
          token,
        },
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary-2/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          {!token ? (
            <>
              <XCircle className="h-16 w-16 text-destructive" />
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No Token Provided</h3>
                <p className="text-muted-foreground">
                  No verification token was provided. Please check your email for the verification link.
                </p>
              </div>
            </>
          ) : isPending ? (
            <>
              <LoaderCircle className="h-16 w-16 text-primary animate-spin" />
              <p className="text-muted-foreground text-center">
                Verifying your email address...
              </p>
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <div className="text-center space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Email Verified Successfully!</h3>
                  <p className="text-muted-foreground">
                    Your email has been verified. You can now log in to your account.
                  </p>
                </div>
                <Button asChild className="w-full">
                  <Link to="/">Go to Homepage</Link>
                </Button>
              </div>
            </>
          ) : isError ? (
            <>
              <XCircle className="h-16 w-16 text-destructive" />
              <div className="text-center space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Verification Failed</h3>
                  <p className="text-muted-foreground">
                    {error.message || 'The verification token is invalid or has expired. Please request a new verification email.'}
                  </p>
                </div>
                <Button asChild className="w-full" variant="outline">
                  <Link to="/">Go to Homepage</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <Mail className="h-16 w-16 text-primary" />
              <div className="text-center space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Verify Your Email</h3>
                  <p className="text-muted-foreground">
                    Click the button below to verify your email address.
                  </p>
                </div>
                <Button onClick={handleVerify} className="w-full" disabled={isPending}>
                  Verify Email
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

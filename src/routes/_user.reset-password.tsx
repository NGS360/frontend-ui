import { Link, createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ResetPasswordForm } from '@/components/reset-password-form'

// Define the search schema for password reset
const resetPasswordSearchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute('/_user/reset-password')({
  component: RouteComponent,
  validateSearch: resetPasswordSearchSchema,
})

function RouteComponent() {
  const search = Route.useSearch()
  const { token } = search

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary-2/5 p-4">
      {!token ? (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Invalid Reset Link</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <XCircle className="h-16 w-16 text-destructive" />
            <div className="text-center space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">No Token Provided</h3>
                <p className="text-muted-foreground">
                  No reset token was provided. Please check your email for the password reset link.
                </p>
              </div>
              <Button asChild className="w-full" variant="outline">
                <Link to="/">Go to Homepage</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ResetPasswordForm token={token} />
      )}
    </div>
  )
}

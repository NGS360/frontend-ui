import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { z } from 'zod'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import type { SubmitHandler } from 'react-hook-form'
import type { ComponentPropsWithoutRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { NGS360Logo } from '@/components/ngs360-logo'
import { useAuth } from '@/context/auth-context'
import { getAvailableOauthProvidersOptions } from '@/client/@tanstack/react-query.gen'

// Define the schema for the form fields
// This is used to perform client-side validation
const schema = z.object({
  username: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(50),
})

type FormFields = z.infer<typeof schema>

export function LoginForm({
  className,
  ...props
}: ComponentPropsWithoutRef<'form'>) {
  const navigate = useNavigate()
  const { basicLogin } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const apiUrl = import.meta.env.VITE_API_URL.replace(/\/$/, '')

  const { data: oauthProviders } = useQuery(getAvailableOauthProvidersOptions())

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormFields>({
    defaultValues: {
      username: '',
      password: '',
    },
    resolver: zodResolver(schema),
  })

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    setIsLoading(true)
    try {
      await basicLogin(data.username, data.password)
      toast.success('Login successful')
      navigate({ to: '/' })
    } catch (error: any) {
      const message = error?.message || 'An unknown error occurred.'
      setError('root', { message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = (authorizeUrl: string) => {
    const redirectUri = `${window.location.origin}/oauth/github/callback`
    const separator = authorizeUrl.includes('?') ? '&' : '?'
    window.location.href = `${authorizeUrl}${separator}redirect_uri=${encodeURIComponent(redirectUri)}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary-2/5 p-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <Card>
          <CardHeader></CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className={cn('flex flex-col gap-6', className)}
              {...props}
            >
              {/* Logo and Title Section */}
              <div className="flex flex-col items-center gap-2 text-center">
                <NGS360Logo className="mb-2" />
                <h1 className="text-2xl font-bold">Login</h1>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Enter your email and password below to login to your NGS360 account.
                </p>
              </div>

              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    {...register('username')}
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    required
                  />
                  {errors.username && (
                    <div className="text-red-500 text-xs text-left">
                      {errors.username.message}
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <Input
                    {...register('password')}
                    id="password"
                    type="password"
                    placeholder="********"
                    required
                  />
                  {errors.password && (
                    <div className="text-red-500 text-xs text-left">
                      {errors.password.message}
                    </div>
                  )}
                </div>
              </div>

              <Button
                disabled={isLoading}
                type="submit"
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <LoaderCircle className="animate-spin h-4 w-4 text-white" />
                ) : null}
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>

              {errors.root && (
                <div className="text-red-500 text-sm text-center">
                  {errors.root.message}
                </div>
              )}

              {/* OAuth Providers Section */}
              {oauthProviders && oauthProviders.providers.length > 0 && (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        or continue with
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {oauthProviders.providers.map((provider) => (
                      <Button
                        key={provider.name}
                        type="button"
                        variant="outline"
                        onClick={() => handleOAuthLogin(`${apiUrl}${provider.authorize_url}`)}
                        className="flex items-center gap-2"
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
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="underline underline-offset-4">
                  Create an account
                </Link>
              </div>
            </form>
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

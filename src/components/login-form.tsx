import { Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { LoaderCircle } from 'lucide-react'
import { z } from 'zod'
import { toast } from 'sonner'
import type { ComponentPropsWithoutRef } from 'react'
import type { SubmitHandler} from 'react-hook-form';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { loginMutation } from '@/client/@tanstack/react-query.gen'
import { NGS360Logo } from '@/components/ngs360-logo'

// Define the schema for the form fields
// This is used to perform client-side validation
const schema = z.object({
  username: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(50),
  grant_type: z.string(),
})

type FormFields = z.infer<typeof schema>

export function LoginForm({
  className,
  ...props
}: ComponentPropsWithoutRef<'form'>) {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({
    defaultValues: {
      username: '',
      password: '',
      grant_type: 'password',
    },
    resolver: zodResolver(schema),
  })

  const { mutate, isPending } = useMutation({
    ...loginMutation(),
    onError: (error) => {
      const message =
        error.response?.data.detail?.toString() || 'An unknown error occurred.'
      setError('root', { message })
    },
    onSuccess: () => {
      toast.success('Login successful')
      navigate({ to: '/' })
    },
  })

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    mutate({ body: { ...data } })
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
                <h1 className="text-2xl font-bold">Login to your account</h1>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Enter your email and password below to login to your account.
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
                      to="/password-reset"
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
                disabled={isSubmitting || isPending}
                type="submit"
                className="flex items-center gap-2"
              >
                {isSubmitting || isPending ? (
                  <LoaderCircle className="animate-spin h-4 w-4 text-white" />
                ) : null}
                {isSubmitting || isPending ? 'Logging in...' : 'Login'}
              </Button>

              {errors.root && (
                <div className="text-red-500 text-sm text-center">
                  {errors.root.message}
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
          <p>© 2026 BMS NGS360. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

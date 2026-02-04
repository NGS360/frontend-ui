import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, LoaderCircle, XCircle } from 'lucide-react'
import { z } from 'zod'
import { toast } from 'sonner'
import type { ComponentPropsWithoutRef } from 'react'
import type { SubmitHandler } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { confirmPasswordResetMutation } from '@/client/@tanstack/react-query.gen'
import { NGS360Logo } from '@/components/ngs360-logo'

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must be at most 100 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type FormFields = z.infer<typeof schema>

interface ResetPasswordFormProps extends ComponentPropsWithoutRef<'form'> {
  token: string
}

export function ResetPasswordForm({
  token,
  className,
  ...props
}: ResetPasswordFormProps) {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    resolver: zodResolver(schema),
  })

  const { mutate, isPending, isSuccess, isError, error } = useMutation({
    ...confirmPasswordResetMutation(),
    onError: (err) => {
      const message =
        err.response?.data.detail?.toString() || 
        'The reset token is invalid or has expired. Please request a new password reset.'
      setError('root', { message })
      toast.error(message)
    },
    onSuccess: () => {
      toast.success('Password reset successful! You can now log in with your new password.')
    },
  })

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    mutate({ 
      body: { 
        token,
        new_password: data.password,
      } 
    })
  }

  // Show success state
  if (isSuccess) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader></CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <div className="text-center space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Password Reset Successful!</h3>
              <p className="text-muted-foreground">
                Your password has been reset. You can now log in with your new password.
              </p>
            </div>
            <Button 
              onClick={() => navigate({ to: '/login' })} 
              className="w-full"
            >
              Go to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show error state
  if (isError) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader></CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <XCircle className="h-16 w-16 text-destructive" />
          <div className="text-center space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Reset Failed</h3>
              <p className="text-muted-foreground">
                {error.response?.data.detail?.toString() || 
                 'The reset token is invalid or has expired. Please request a new password reset.'}
              </p>
            </div>
            <Button 
              onClick={() => navigate({ to: '/forgot-password' })} 
              className="w-full"
              variant="outline"
            >
              Request New Reset Link
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
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
            <h1 className="text-2xl font-bold">Reset Your Password</h1>
            <p className="text-sm text-muted-foreground max-w-xs">
              Enter your new password below.
            </p>
          </div>

          {/* Password Input */}
          <div className="grid gap-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              {...register('password')}
              id="password"
              type="password"
              placeholder="Enter new password"
              required
            />
            {errors.password && (
              <div className="text-red-500 text-xs text-left">
                {errors.password.message}
              </div>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              {...register('confirmPassword')}
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              required
            />
            {errors.confirmPassword && (
              <div className="text-red-500 text-xs text-left">
                {errors.confirmPassword.message}
              </div>
            )}
          </div>

          {/* Root Error */}
          {errors.root && (
            <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-950/20 p-3 rounded-md">
              {errors.root.message}
            </div>
          )}

          {/* Submit Button */}
          <Button
            disabled={isSubmitting || isPending}
            type="submit"
            className="flex items-center gap-2"
          >
            {isSubmitting || isPending ? (
              <>
                <LoaderCircle className="animate-spin" size={18} />
                Resetting Password...
              </>
            ) : (
              'Reset Password'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

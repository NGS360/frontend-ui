import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { LoaderCircle } from 'lucide-react'
import { z } from 'zod'
import { toast } from 'sonner'
import type { ComponentPropsWithoutRef } from 'react'
import type { SubmitHandler } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { requestPasswordResetMutation } from '@/client/@tanstack/react-query.gen'
import { NGS360Logo } from '@/components/ngs360-logo'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type FormFields = z.infer<typeof schema>

export function PasswordResetForm({
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
      email: '',
    },
    resolver: zodResolver(schema),
  })

  const { mutate, isPending } = useMutation({
    ...requestPasswordResetMutation(),
    onError: (error) => {
      const message =
        error.response?.data.detail?.toString() || 'An unknown error occurred.'
      setError('root', { message })
    },
    onSuccess: () => {
      toast.success('Password reset email sent. Please check your inbox.')
      navigate({ to: '/login' })
    },
  })

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    mutate({ body: { ...data } })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary-2/5 p-4">
      <div className="w-full max-w-md">
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
                <h1 className="text-2xl font-bold">Password Reset</h1>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Send an email to reset your NGS360 account password.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  {...register('email')}
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  required
                />
                {errors.email && (
                  <div className="text-red-500 text-xs text-left">
                    {errors.email.message}
                  </div>
                )}
              </div>

              <Button
                disabled={isSubmitting || isPending}
                type="submit"
                className="flex items-center gap-2"
              >
                {isSubmitting || isPending ? (
                  <LoaderCircle className="animate-spin h-4 w-4 text-white" />
                ) : null}
                {isSubmitting || isPending ? 'Sending...' : 'Send Email'}
              </Button>

              {errors.root && (
                <div className="text-red-500 text-sm text-center">
                  {errors.root.message}
                </div>
              )}
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

import { Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { LoaderCircle } from 'lucide-react'
import { z } from 'zod'
import { useState } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import type { SubmitHandler } from 'react-hook-form'
import type { UserPublic, UserRegister } from '@/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { registerMutation } from '@/client/@tanstack/react-query.gen'
import { NGS360Logo } from '@/components/ngs360-logo'
import { RegisterSuccessDialog } from '@/components/register-success-dialog'

const schema = z
  .object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Please enter a valid email address'),
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(50),
    confirm_password: z.string().min(8).max(50),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

type FormFields = z.infer<typeof schema>

export function RegisterForm({
  className,
  ...props
}: ComponentPropsWithoutRef<'form'>) {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending } = useMutation({
    ...registerMutation(),
    onError: (error) => {
      const message =
        error.response?.data.detail?.toString() || 'An unknown error occurred.'
      setError('root', { message })
    },
    onSuccess: (_data: UserPublic, variables: { body: UserRegister }) => {
      setEmail(variables.body.email)
      setPassword(variables.body.password)
      setDialogOpen(true)
    },
  })

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    const body: UserRegister = {
      username: data.username,
      email: data.email,
      full_name: data.full_name,
      password: data.password,
    }
    mutate({ body: { ...body } })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary-2/5 p-4">
      <RegisterSuccessDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        data={{ username: email, password: password }}
      />
      
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
                <h1 className="text-2xl font-bold">Create an account</h1>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Register for a new NGS360 account.
                </p>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    {...register('username')}
                    id="username"
                    type="text"
                    placeholder="johndoe"
                    required
                  />
                  {errors.username && (
                    <div className="text-red-500 text-xs text-left">
                      {errors.username.message}
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    {...register('full_name')}
                    id="full_name"
                    type="text"
                    placeholder="John Doe"
                    required
                  />
                  {errors.full_name && (
                    <div className="text-red-500 text-xs text-left">
                      {errors.full_name.message}
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    {...register('email')}
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    required
                  />
                  {errors.email && (
                    <div className="text-red-500 text-xs text-left">
                      {errors.email.message}
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
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

                <div className="grid gap-2">
                  <Label htmlFor="confirm_password">Confirm Password</Label>
                  <Input
                    {...register('confirm_password')}
                    id="confirm_password"
                    type="password"
                    placeholder="********"
                    required
                  />
                  {errors.confirm_password && (
                    <div className="text-red-500 text-xs text-left">
                      {errors.confirm_password.message}
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
                {isSubmitting || isPending ? 'Creating account...' : 'Create Account'}
              </Button>

              {errors.root && (
                <div className="text-red-500 text-sm text-center">
                  {errors.root.message}
                </div>
              )}

              <div className="text-center text-sm">
                Already have an account?{' '}
                <Link to="/login" className="underline underline-offset-4">
                  Log in
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

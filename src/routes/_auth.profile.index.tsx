import { createFileRoute } from '@tanstack/react-router'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { KeyRound, Mail, ShieldCheck } from 'lucide-react'
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table'
import type { BatchJobPublic } from '@/client'
import { getJobsOptions, getJobsQueryKey, resendVerificationMutation } from '@/client/@tanstack/react-query.gen'
import { useViewJob } from '@/hooks/use-job-queries'
import { ServerDataTable } from '@/components/data-table/data-table'
import { SortableHeader } from '@/components/data-table/sortable-header'
import { CopyableText } from '@/components/copyable-text'
import { JobStatusBadge } from '@/components/job-status-badge'
import { FullscreenSpinner } from '@/components/spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/auth-context'
import { ChangePasswordForm } from '@/components/change-password-form'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export const Route = createFileRoute('/_auth/profile/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { user } = useAuth()
  const { viewJob } = useViewJob()

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

  // Table state for jobs
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  })

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'submitted_on', desc: true }
  ])

  // Query key for jobs list
  const jobsQueryKey = getJobsQueryKey({
    query: {
      skip: pagination.pageIndex * pagination.pageSize,
      limit: pagination.pageSize,
      sort_by: sorting[0]?.id as 'id' | 'name' | 'user' | 'status' | 'submitted_on',
      sort_order: sorting[0]?.desc ? 'desc' : 'asc',
      user: user?.email,
    },
  })

  // Query user-specific jobs
  const { data: jobsData, error } = useQuery({
    ...getJobsOptions({
      query: {
        skip: pagination.pageIndex * pagination.pageSize,
        limit: pagination.pageSize,
        sort_by: sorting[0]?.id as 'id' | 'name' | 'user' | 'status' | 'submitted_on',
        sort_order: sorting[0]?.desc ? 'desc' : 'asc',
        user: user?.email, // Filter by current user from context
      },
    }),
    placeholderData: keepPreviousData
  })

  // Handle job row click
  const handleJobClick = (jobId: string) => {
    // Mark as viewed and navigate, also invalidate the profile-specific jobs query
    viewJob(jobId, [jobsQueryKey])
  }

  // Define job columns
  const jobColumns: Array<ColumnDef<BatchJobPublic>> = [
    {
      id: 'viewed',
      header: '',
      cell: ({ row }) => {
        const job = row.original
        return (
          <div className="flex items-center justify-center w-4">
            {!job.viewed ? (
              <div className="h-2 w-2 rounded-full bg-primary" title="Unread" />
            ) : (
              <div className="h-2 w-2 rounded-full border border-muted-foreground/30" title="Read" />
            )}
          </div>
        )
      },
      enableSorting: false,
      size: 40,
    },
    {
      accessorKey: 'id',
      meta: { alias: 'Job ID' },
      header: ({ column }) => <SortableHeader column={column} name="Job ID" />,
      cell: ({ cell }) => {
        const id = cell.getValue() as string
        return <CopyableText text={id} variant='primary' />
      }
    },
    {
      accessorKey: 'name',
      meta: { alias: 'Job Name' },
      header: ({ column }) => <SortableHeader column={column} name="Job Name" />,
      cell: ({ cell }) => {
        const name = cell.getValue() as string
        return <span className='text-sm'>{name}</span>
      }
    },
    {
      accessorKey: 'status',
      meta: { alias: 'Status' },
      header: ({ column }) => <SortableHeader column={column} name="Status" />,
      cell: ({ cell }) => {
        const status = cell.getValue() as BatchJobPublic['status']
        return <JobStatusBadge status={status} />
      }
    },
    {
      accessorKey: 'submitted_on',
      meta: { alias: 'Submitted' },
      header: ({ column }) => <SortableHeader column={column} name="Submitted" />,
      cell: ({ cell }) => {
        const submitted = cell.getValue() as string
        const date = new Date(submitted.replace(' ', 'T') + 'Z')
        return <span className='text-sm text-muted-foreground'>{date.toLocaleString(undefined, { timeZoneName: 'short' })}</span>
      }
    },
  ]

  if (error) return 'An error has occurred: ' + error.message
  if (!jobsData) return <FullscreenSpinner variant='ellipsis' />

  const totalPages = Math.ceil(jobsData.count / pagination.pageSize)

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
              <div className="pt-4 border-t">           
                <ChangePasswordForm
                  trigger={
                    <Button variant="outline" size="sm">
                      <KeyRound className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Jobs Section */}
      <section id="jobs" className="scroll-mt-20">
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <h1 className="text-3xl">Jobs</h1>
            <p className="text-muted-foreground">
              View and manage your submitted jobs.
            </p>
          </div>

          <ServerDataTable
            data={jobsData.data}
            columns={jobColumns}
            pagination={pagination}
            onPaginationChange={setPagination}
            pageCount={totalPages}
            totalItems={jobsData.count}
            sorting={sorting}
            onSortingChange={setSorting}
            columnVisibility={{ id: false }}
            rowClickCallback={(row) => handleJobClick(row.original.id)}
          />
        </div>
      </section>

      {/* Settings Section */}
      <section id="settings" className="scroll-mt-20">
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <h1 className="text-3xl">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account preferences and settings.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Update your account preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Settings configuration coming soon...</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

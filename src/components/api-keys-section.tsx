import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Ban, Info, LoaderCircle, Plus, Trash2, X } from 'lucide-react'
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table'
import type { SubmitHandler } from 'react-hook-form'
import type { ApiKeyCreateResponse, ApiKeyPublic } from '@/client'
import {
  createApiKeyMutation,
  deleteApiKeyMutation,
  listApiKeysOptions,
  listApiKeysQueryKey,
  revokeApiKeyMutation,
} from '@/client/@tanstack/react-query.gen'
import { getFormApiErrorMessage, toastApiError } from '@/lib/error-utils'
import { ServerDataTable } from '@/components/data-table/data-table'
import { SortableHeader } from '@/components/data-table/sortable-header'
import { CopyableText } from '@/components/copyable-text'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// --- Create API Key Form ---

const CreateApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  expires_at: z.string().optional(),
})

type CreateApiKeyFields = z.infer<typeof CreateApiKeySchema>

function CreateApiKeyButton({
  onCreated,
}: {
  onCreated: (response: ApiKeyCreateResponse) => void
}) {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateApiKeyFields>({
    defaultValues: { name: '', expires_at: '' },
    resolver: zodResolver(CreateApiKeySchema),
  })

  const { mutate, isPending } = useMutation({
    ...createApiKeyMutation(),
    onError: (error) => {
      setError('root', { message: getFormApiErrorMessage(error, 'Failed to create API key.') })
    },
    onSuccess: (data: ApiKeyCreateResponse) => {
      reset()
      setIsOpen(false)
      toast.success('API key created successfully')
      onCreated(data)
      queryClient.invalidateQueries({ queryKey: listApiKeysQueryKey() })
    },
  })

  const onSubmit: SubmitHandler<CreateApiKeyFields> = (data) => {
    mutate({
      body: {
        name: data.name,
        expires_at: data.expires_at || undefined,
      },
    })
  }

  const handleOpenChange = (willOpen: boolean) => {
    if (!willOpen) reset()
    setIsOpen(willOpen)
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Create API Key
        </Button>
      </SheetTrigger>
      <SheetContent srTitle="Create API Key">
        <SheetHeader>
          <SheetTitle>Create API Key</SheetTitle>
          <SheetDescription>
            Create a new API key for programmatic access.
          </SheetDescription>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="api-key-name">Name</Label>
                <Input
                  {...register('name')}
                  id="api-key-name"
                  placeholder="e.g. CI/CD Pipeline"
                  required
                />
                {errors.name && (
                  <div className="text-xs text-red-500">{errors.name.message}</div>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="api-key-expires">Expiration Date (optional)</Label>
                <Input
                  {...register('expires_at')}
                  id="api-key-expires"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.expires_at && (
                  <div className="text-xs text-red-500">{errors.expires_at.message}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  Leave blank for a key that never expires.
                </p>
              </div>
              {errors.root && (
                <div className="text-red-500 text-sm text-center">{errors.root.message}</div>
              )}
            </div>
          </form>
        </SheetHeader>
        <SheetFooter className="mt-auto">
          <Button
            disabled={isSubmitting || isPending}
            type="submit"
            onClick={handleSubmit(onSubmit)}
          >
            {(isSubmitting || isPending) && (
              <LoaderCircle className="animate-spin h-4 w-4" />
            )}
            {isSubmitting || isPending ? 'Creating...' : 'Create API Key'}
          </Button>
          <SheetClose asChild>
            <Button type="button" variant="secondary" onClick={() => reset()}>
              Cancel
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// --- Confirmation Dialog ---

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  isPending,
  variant = 'destructive',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  isPending: boolean
  variant?: 'destructive' | 'default'
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant={variant} onClick={onConfirm} disabled={isPending}>
            {isPending && <LoaderCircle className="animate-spin h-4 w-4" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Newly Created Key Banner ---

function NewKeyBanner({
  apiKey,
  onDismiss,
}: {
  apiKey: ApiKeyCreateResponse
  onDismiss: () => void
}) {
  return (
    <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={onDismiss}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Dismiss</span>
      </Button>
      <CardContent className="pt-4 pb-4 pr-10 space-y-3">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Make sure to copy your API key now. You won't be able to see it again.
            </p>
            <div className="bg-background border rounded px-3 py-2 flex items-center gap-2">
              <code className="text-sm font-mono break-all flex-1">{apiKey.key}</code>
              <CopyableText text={apiKey.key} variant="default" size="sm" asChild>
                <span />
              </CopyableText>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// --- Main APIKeysSection ---

export function APIKeysSection() {
  const queryClient = useQueryClient()
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKeyCreateResponse | null>(null)

  // Confirm dialog state
  const [confirmAction, setConfirmAction] = useState<{
    type: 'revoke' | 'delete'
    keyId: string
    keyName: string
  } | null>(null)

  // Table state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [sorting, setSorting] = useState<SortingState>([])

  // Query API keys
  const { data: apiKeysData } = useQuery({
    ...listApiKeysOptions({
      query: {
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
      },
    }),
    placeholderData: keepPreviousData,
  })

  // Revoke mutation
  const revokeMutation = useMutation({
    ...revokeApiKeyMutation(),
    onSuccess: () => {
      toast.success('API key revoked')
      setConfirmAction(null)
      queryClient.invalidateQueries({ queryKey: listApiKeysQueryKey() })
    },
    onError: (error) => {
      toastApiError(error, 'Failed to revoke API key')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    ...deleteApiKeyMutation(),
    onSuccess: () => {
      toast.success('API key deleted')
      setConfirmAction(null)
      queryClient.invalidateQueries({ queryKey: listApiKeysQueryKey() })
    },
    onError: (error) => {
      toastApiError(error, 'Failed to delete API key')
    },
  })

  const handleConfirm = () => {
    if (!confirmAction) return
    if (confirmAction.type === 'revoke') {
      revokeMutation.mutate({ path: { key_id: confirmAction.keyId } })
    } else {
      deleteMutation.mutate({ path: { key_id: confirmAction.keyId } })
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Table columns
  const columns: Array<ColumnDef<ApiKeyPublic>> = [
    {
      accessorKey: 'name',
      meta: { alias: 'Name' },
      header: ({ column }) => <SortableHeader column={column} name="Name" />,
      cell: ({ cell }) => <span className="text-sm font-medium">{cell.getValue() as string}</span>,
    },
    {
      accessorKey: 'key_prefix',
      meta: { alias: 'Key Prefix' },
      header: 'Key Prefix',
      cell: ({ cell }) => (
        <code className="font-mono">{cell.getValue() as string}...</code>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'is_active',
      meta: { alias: 'Status' },
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.original.is_active
        return (
          <Badge variant={isActive ? 'default' : 'destructive'}>
            {isActive ? 'Active' : 'Revoked'}
          </Badge>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: 'created_at',
      meta: { alias: 'Created' },
      header: ({ column }) => <SortableHeader column={column} name="Created" />,
      cell: ({ cell }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(cell.getValue() as string)}
        </span>
      ),
    },
    {
      accessorKey: 'expires_at',
      meta: { alias: 'Expires' },
      header: 'Expires',
      cell: ({ cell }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(cell.getValue() as string | null)}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'last_used_at',
      meta: { alias: 'Last Used' },
      header: 'Last Used',
      cell: ({ cell }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(cell.getValue() as string | null)}
        </span>
      ),
      enableSorting: false,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const key = row.original
        return (
          <div className="flex items-center gap-1">
            {key.is_active && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setConfirmAction({ type: 'revoke', keyId: key.id, keyName: key.name })
                }}
              >
                <Ban className="h-4 w-4" />
                Revoke
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setConfirmAction({ type: 'delete', keyId: key.id, keyName: key.name })
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )
      },
      enableSorting: false,
    },
  ]

  const totalItems = apiKeysData?.count ?? 0
  const totalPages = Math.ceil(totalItems / pagination.pageSize)

  const toolbar = (
    <CreateApiKeyButton onCreated={(response) => setNewlyCreatedKey(response)} />
  )

  return (
    <Card>
      <CardContent className="space-y-4">
        {newlyCreatedKey && (
          <NewKeyBanner
            apiKey={newlyCreatedKey}
            onDismiss={() => setNewlyCreatedKey(null)}
          />
        )}

        <ServerDataTable
          data={apiKeysData?.data ?? []}
          columns={columns}
          pagination={pagination}
          onPaginationChange={setPagination}
          pageCount={totalPages}
          totalItems={totalItems}
          sorting={sorting}
          onSortingChange={setSorting}
          tableTools={toolbar}
          notFoundComponent={
            <div className="text-center py-8 text-muted-foreground">
              No API keys found. Create one to get started.
            </div>
          }
        />
      </CardContent>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null)
        }}
        title={confirmAction?.type === 'revoke' ? 'Revoke API Key' : 'Delete API Key'}
        description={
          confirmAction?.type === 'revoke'
            ? `This will permanently disable the key "${confirmAction.keyName}". Any applications using this key will lose access.`
            : `This will permanently remove the key "${confirmAction?.keyName}". This action cannot be undone.`
        }
        confirmLabel={confirmAction?.type === 'revoke' ? 'Revoke' : 'Delete'}
        onConfirm={handleConfirm}
        isPending={revokeMutation.isPending || deleteMutation.isPending}
      />
    </Card>
  )
}

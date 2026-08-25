import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useId, useState } from 'react'
import { toast } from 'sonner'
import { LoaderCircle } from 'lucide-react'
import type { JSX } from 'react'
import type React from 'react'
import type { SubmitHandler } from 'react-hook-form'
import type { RoleScope } from '@/client'
import {
  createRoleMutation,
  listPermissionsOptions,
  listRolesQueryKey,
} from '@/client/@tanstack/react-query.gen'
import { PermissionMatrix } from '@/components/permission-matrix'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Textarea } from '@/components/ui/textarea'
import { getFormApiErrorMessage } from '@/lib/error-utils'

// Define Schema w/Validation
//
// The lengths are the server's own, from RoleCreate in api/rbac/models.py, so a
// name one character too long is a message rather than a 422.
//
// The name pattern is not the server's: RoleCreate constrains length only. It is
// a UI convention, and it matches all nine builtins, because the name is a
// permanent identifier that ends up in a URL — /admin/roles/$name — while
// display_name is the field meant to be readable. Keeping it means a custom role
// cannot look unlike the built-in it is a variant of.
const CreateRoleSchema = z.object({
  name: z
    .string()
    .nonempty('Name is required')
    .max(64, 'Name must be 64 characters or fewer')
    .regex(
      /^[a-z][a-z0-9_]*$/,
      'Use lowercase letters, digits and underscores, starting with a letter',
    ),
  display_name: z
    .string()
    .nonempty('Display name is required')
    .max(128, 'Display name must be 128 characters or fewer'),
  description: z
    .string()
    .max(512, 'Description must be 512 characters or fewer')
    .optional(),
})

type FormFields = z.infer<typeof CreateRoleSchema>

interface CreateRoleFormProps {
  /** Trigger for the Sheet component */
  trigger: JSX.Element
  /** Optional DOM id prefix for this form instance */
  idPrefix?: string
}

/**
 * Create a custom role.
 *
 * Custom roles are the reason roles are database rows rather than code: they
 * are how "contributor without delete" and every similar variant gets served
 * without a deploy. Builtin roles cannot be edited at all, so this is the only
 * way to get a permission set that is not one of the nine shipped.
 *
 * Scope and the permission set are held outside the form rather than registered
 * as fields: neither is an input, and the two are coupled — changing scope has
 * to filter the selection — which react-hook-form would only get in the way of.
 */
export const CreateRoleForm: React.FC<CreateRoleFormProps> = ({ trigger, idPrefix }) => {
  const generatedId = useId()
  const baseId = (idPrefix || `create-role-${generatedId.replace(/:/g, '')}`).replace(
    /[^a-zA-Z0-9_-]+/g,
    '-',
  )

  // Control sheet open/close state
  const [isOpen, setIsOpen] = useState(false)
  const [scope, setScope] = useState<RoleScope>('global')
  const [permissions, setPermissions] = useState<Array<string>>([])

  const { data: catalog } = useQuery(listPermissionsOptions())

  // Configure form
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({
    defaultValues: {
      name: '',
      display_name: '',
      description: '',
    },
    resolver: zodResolver(CreateRoleSchema),
  })

  const resetAll = () => {
    reset()
    setScope('global')
    setPermissions([])
  }

  const handleOnOpenChange = (willOpen: boolean) => {
    if (!willOpen) resetAll()
    setIsOpen(willOpen)
  }

  // Mutation
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    ...createRoleMutation(),
    onError: (error) => {
      setError('root', { message: getFormApiErrorMessage(error, 'An unknown error occurred.') })
    },
    onSuccess: (role) => {
      void queryClient.invalidateQueries({ queryKey: listRolesQueryKey() })
      toast.success(`Created role ${role.display_name}`)
      resetAll()
      setIsOpen(false)
    },
  })

  // Switching to project scope drops anything the project plane cannot honour.
  // The server would reject the whole request with a 422; dropping them here
  // keeps the picker and the payload honest about what is actually being asked.
  const onScopeChange = (next: RoleScope) => {
    setScope(next)
    if (next === 'project' && catalog) {
      const scopable = new Set(
        catalog.filter((entry) => entry.project_scopable).map((entry) => entry.permission),
      )
      setPermissions((current) => current.filter((permission) => scopable.has(permission)))
    }
  }

  // Form submission
  const onSubmit: SubmitHandler<FormFields> = (data) => {
    mutate({
      body: {
        name: data.name,
        display_name: data.display_name,
        description: data.description || null,
        scope,
        permissions,
      },
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOnOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent id={`${baseId}-sheet`} srTitle="Create role" className="sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle id={`${baseId}-title`}>Create a custom role</SheetTitle>
          <SheetDescription>
            Compose a permission set from the catalog. Built-in roles are defined
            in code and re-derived on every deploy, so a variant of one belongs
            here rather than as an edit to it.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <form id={`${baseId}-form`} onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor={`${baseId}-name`}>Name</Label>
                <Input
                  {...register('name')}
                  id={`${baseId}-name`}
                  type="text"
                  placeholder="contributor_no_delete"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Permanent identifier. Lowercase, no spaces.
                </p>
                {errors.name && (
                  <div className="text-xs text-red-500 text-left">
                    {errors.name.message}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`${baseId}-display-name`}>Display name</Label>
                <Input
                  {...register('display_name')}
                  id={`${baseId}-display-name`}
                  type="text"
                  placeholder="Contributor without delete"
                  required
                />
                {errors.display_name && (
                  <div className="text-xs text-red-500 text-left">
                    {errors.display_name.message}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`${baseId}-description`}>Description</Label>
                <Textarea
                  {...register('description')}
                  id={`${baseId}-description`}
                  placeholder="Who this is for, and why it differs from the built-in role."
                />
                {errors.description && (
                  <div className="text-xs text-red-500 text-left">
                    {errors.description.message}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`${baseId}-scope`}>Scope</Label>
                <Select value={scope} onValueChange={(value) => onScopeChange(value as RoleScope)}>
                  <SelectTrigger id={`${baseId}-scope`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global — granted platform-wide</SelectItem>
                    <SelectItem value="project">Project — granted per project</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {scope === 'global'
                    ? 'Applies everywhere, to every project.'
                    : 'Only project-scopable permissions can be granted this way.'}
                </p>
              </div>

              <div className="grid gap-2">
                <Label>Permissions ({permissions.length})</Label>
                {catalog ? (
                  <PermissionMatrix
                    catalog={catalog}
                    selected={permissions}
                    onChange={setPermissions}
                    projectScopableOnly={scope === 'project'}
                    idPrefix={`${baseId}-permissions`}
                  />
                ) : (
                  <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {errors.root && (
                <div className="text-red-500 text-sm text-center">
                  {errors.root.message}
                </div>
              )}
            </div>
          </form>
        </div>

        <SheetFooter className="mt-auto">
          <Button
            id={`${baseId}-submit`}
            disabled={isSubmitting || isPending}
            type="submit"
            onClick={handleSubmit(onSubmit)}
          >
            {isSubmitting || isPending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : null}
            {isSubmitting || isPending ? 'Creating role...' : 'Create role'}
          </Button>
          <SheetClose asChild>
            <Button
              id={`${baseId}-cancel`}
              type="button"
              variant='secondary'
              onClick={() => { resetAll() }}
            >
              Cancel
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

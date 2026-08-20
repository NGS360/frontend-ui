import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { toast } from 'sonner'
import { LoaderCircle } from 'lucide-react'
import type { JSX } from 'react'
import type React from 'react'
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

interface CreateRoleFormProps {
  trigger: JSX.Element
  idPrefix?: string
}

// The server's own constraint on role.name, mirrored so the message arrives
// before the round trip rather than as a 422 afterwards.
const NAME_PATTERN = /^[a-z][a-z0-9_]*$/

/**
 * Create a custom role.
 *
 * Custom roles are the reason roles are database rows rather than code: they
 * are how "contributor without delete" and every similar variant gets served
 * without a deploy. Builtin roles cannot be edited at all, so this is the only
 * way to get a permission set that is not one of the nine shipped.
 */
export const CreateRoleForm: React.FC<CreateRoleFormProps> = ({ trigger, idPrefix }) => {
  const generatedId = useId()
  const baseId = (idPrefix || `create-role-${generatedId.replace(/:/g, '')}`).replace(
    /[^a-zA-Z0-9_-]+/g,
    '-',
  )

  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [description, setDescription] = useState('')
  const [scope, setScope] = useState<RoleScope>('global')
  const [permissions, setPermissions] = useState<Array<string>>([])
  const [formError, setFormError] = useState<string | null>(null)

  const { data: catalog } = useQuery(listPermissionsOptions())
  const queryClient = useQueryClient()

  const reset = () => {
    setName('')
    setDisplayName('')
    setDescription('')
    setScope('global')
    setPermissions([])
    setFormError(null)
  }

  const { mutate, isPending } = useMutation({
    ...createRoleMutation(),
    onError: (error) => {
      setFormError(getFormApiErrorMessage(error, 'An unknown error occurred.'))
    },
    onSuccess: (role) => {
      void queryClient.invalidateQueries({ queryKey: listRolesQueryKey() })
      toast.success(`Created role ${role.display_name}`)
      reset()
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

  const submit = () => {
    if (!NAME_PATTERN.test(name)) {
      setFormError('Name must be lowercase letters, digits and underscores, starting with a letter.')
      return
    }
    if (!displayName.trim()) {
      setFormError('A display name is required.')
      return
    }
    setFormError(null)
    mutate({
      body: {
        name,
        display_name: displayName,
        description: description || null,
        scope,
        permissions,
      },
    })
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(willOpen) => {
        if (!willOpen) reset()
        setIsOpen(willOpen)
      }}
    >
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
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor={`${baseId}-name`}>Name</Label>
              <Input
                id={`${baseId}-name`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="contributor_no_delete"
              />
              <p className="text-xs text-muted-foreground">
                Permanent identifier. Lowercase, no spaces.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`${baseId}-display-name`}>Display name</Label>
              <Input
                id={`${baseId}-display-name`}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Contributor without delete"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`${baseId}-description`}>Description</Label>
              <Textarea
                id={`${baseId}-description`}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Who this is for, and why it differs from the built-in role."
              />
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

            {formError && <p className="text-sm text-red-500">{formError}</p>}
          </div>
        </div>

        <SheetFooter className="mt-auto">
          <Button id={`${baseId}-submit`} disabled={isPending} onClick={submit}>
            {isPending && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {isPending ? 'Creating role...' : 'Create role'}
          </Button>
          <SheetClose asChild>
            <Button id={`${baseId}-cancel`} type="button" variant="secondary" onClick={reset}>
              Cancel
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

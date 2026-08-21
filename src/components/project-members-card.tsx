import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { LoaderCircle, Plus, Trash2 } from 'lucide-react'
import {
  addProjectMemberMutation,
  listProjectMembersOptions,
  listProjectMembersQueryKey,
  listRolesOptions,
  removeProjectMemberMutation,
} from '@/client/@tanstack/react-query.gen'
import { UserPicker } from '@/components/user-picker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { classifyError, toastApiError } from '@/lib/error-utils'

interface ProjectMembersCardProps {
  projectId: string
}

/**
 * Who has a role on this project, and the controls to change it.
 *
 * Lives under the project rather than in the admin panel because project
 * membership is self-serve: an owner adds their own collaborators without
 * needing an administrator, which is the whole point of the project plane.
 *
 * On the project settings page rather than the project page itself, so that the
 * space and the request are spent only when somebody goes looking. A refusal is
 * shown here rather than hidden: on a page the user navigated to deliberately,
 * an empty panel reads as a bug, whereas on the project overview it would have
 * been noise about a control they never asked for.
 *
 * The API guards the listing with the same project:manage_members the mutations
 * need, so a successful response is itself the evidence that this caller may
 * change membership, and no separate check is needed. Project-scoped
 * permissions are not on GET /rbac/me (with a five-figure project count that
 * payload would be unbounded), so this is currently the only way to know.
 */
export const ProjectMembersCard = ({ projectId }: ProjectMembersCardProps) => {
  const queryClient = useQueryClient()
  const [username, setUsername] = useState('')
  const [roleName, setRoleName] = useState('project_viewer')

  const { data: members, error, isLoading } = useQuery({
    ...listProjectMembersOptions({ path: { project_id: projectId } }),
    // A 403 here is the ordinary case for a non-owner, not a fault to retry.
    retry: false,
  })

  const { data: roles } = useQuery(listRolesOptions())
  const projectRoles = (roles ?? []).filter((role) => role.scope === 'project')

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: listProjectMembersQueryKey({ path: { project_id: projectId } }),
    })

  const { mutate: setMember, isPending: isSaving } = useMutation({
    ...addProjectMemberMutation(),
    onSuccess: (_data, variables) => {
      void invalidate()
      toast.success(`${variables.body.username} is now ${variables.body.role}`)
      setUsername('')
    },
    onError: (mutationError) => toastApiError(mutationError, 'Could not change membership'),
  })

  const { mutate: removeMember, isPending: isRemoving } = useMutation({
    ...removeProjectMemberMutation(),
    onSuccess: (_data, variables) => {
      void invalidate()
      toast.success(`Removed ${variables.path.username} from this project`)
    },
    // The last owner cannot be removed: the server returns 409 explaining that
    // the project would be left with nobody able to manage its membership.
    onError: (mutationError) => toastApiError(mutationError, 'Could not remove that member'),
  })

  if (error || isLoading || !members) {
    const friendly = error ? classifyError(error) : undefined
    return (
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            {friendly
              ? friendly.description
              : 'Who can see and change this project.'}
          </CardDescription>
        </CardHeader>
        {!error && (
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading members...
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>
          One role per person on this project. Viewer can read it, contributor
          can change its data and submit work, owner can also manage this list.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No members yet. Anyone with a global role that carries project
            permissions can still reach this project.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Granted</TableHead>
                <TableHead>Source</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.username}>
                  <TableCell className="font-mono text-xs">{member.username}</TableCell>
                  <TableCell>
                    <Select
                      value={member.role}
                      onValueChange={(next) =>
                        setMember({
                          path: { project_id: projectId },
                          body: { username: member.username, role: next },
                        })
                      }
                    >
                      <SelectTrigger
                        id={`project-member-role-${member.username}`}
                        className="w-[190px]"
                        disabled={isSaving}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {projectRoles.map((role) => (
                          <SelectItem key={role.name} value={role.name}>
                            {role.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(member.granted_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-muted-foreground">
                          {member.source}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          {member.source === 'migration'
                            ? 'Inferred from the project creator when RBAC was rolled out, rather than chosen by anyone.'
                            : 'Granted by hand.'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      id={`project-member-remove-${member.username}`}
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      disabled={isRemoving}
                      onClick={() => {
                        const confirmed = window.confirm(
                          `Remove ${member.username} from this project?`,
                        )
                        if (confirmed) {
                          removeMember({
                            path: { project_id: projectId, username: member.username },
                          })
                        }
                      }}
                    >
                      <Trash2 />
                      <span className="sr-only">Remove {member.username}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="flex flex-wrap items-end gap-2">
          <UserPicker
            id="project-member-add-user"
            value={username}
            onChange={setUsername}
            disabled={isSaving}
          />
          <Select value={roleName} onValueChange={setRoleName}>
            <SelectTrigger id="project-member-add-role" className="w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {projectRoles.map((role) => (
                <SelectItem key={role.name} value={role.name}>
                  {role.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            id="project-member-add-submit"
            variant="primary2"
            disabled={!username || isSaving}
            onClick={() =>
              setMember({
                path: { project_id: projectId },
                body: { username, role: roleName },
              })
            }
          >
            {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add member
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

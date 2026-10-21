import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Lock, LockOpen } from 'lucide-react'
import { toast } from 'sonner'
import type { ProjectPublic } from '@/client'
import {
  getProjectByProjectIdQueryKey,
  getProjectsQueryKey,
  setProjectRestrictionMutation,
} from '@/client/@tanstack/react-query.gen'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useProjectAccess } from '@/hooks/use-project-access'
import { toastApiError } from '@/lib/error-utils'

interface ProjectRestrictionCardProps {
  project: ProjectPublic
}

/**
 * The switch that puts a project behind its member list.
 *
 * Unrestricted is the platform's resting posture: any authenticated user can
 * read the project and download its files. Restricting it narrows every
 * project-plane route to members, which is why the control lives here beside
 * the member list rather than on the project page -- the two are one decision,
 * and the list is what the switch turns into the allowlist.
 *
 * Gated on project:manage_members, matching PUT /{project_id}/restriction. It
 * is a route of its own rather than a field on the project update, because
 * closing a project to everyone outside its member list is a different kind of
 * change from renaming it and does not take the same authority: the way back
 * out is to enrol somebody, so the permission that can reopen a project is the
 * one asked for to close it.
 */
export const ProjectRestrictionCard = ({ project }: ProjectRestrictionCardProps) => {
  const queryClient = useQueryClient()
  const { can } = useProjectAccess(project)
  const mayChange = can('project:manage_members')
  const restricted = project.restricted

  const { mutate: setRestricted, isPending } = useMutation({
    ...setProjectRestrictionMutation(),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: getProjectByProjectIdQueryKey({
          path: { project_id: project.project_id },
        }),
      })
      // The project list renders this state too, and it is cached separately.
      void queryClient.invalidateQueries({ queryKey: getProjectsQueryKey() })
      toast.success(
        variables.body.restricted
          ? 'This project is now restricted to its members'
          : 'This project is open to any signed-in user again',
      )
    },
    onError: (mutationError) =>
      toastApiError(mutationError, 'Could not change who can reach this project'),
  })

  const toggle = (next: boolean) => {
    // window.confirm rather than a dialog component, matching the other
    // destructive-ish controls in this app. Both directions are confirmed: one
    // can cut colleagues off from data they are using, the other hands a
    // locked-down project to everyone with an account.
    const message = next
      ? `Restrict "${project.name ?? project.project_id}"?\n\n` +
        'Only the members listed below will be able to see this project, its ' +
        'samples and its files. Anyone not listed loses access immediately.\n\n' +
        'Undoing this needs someone who can manage this project’s members, ' +
        'because reopening it is done from inside.'
      : `Remove the restriction on "${project.name ?? project.project_id}"?\n\n` +
        'Every signed-in user will be able to see this project and download ' +
        'its files again.'
    if (window.confirm(message)) setRestricted({
      path: { project_id: project.project_id },
      body: { restricted: next },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Access
          {/* Shown in both states on purpose. With an opt-in control the
              dangerous state is a project nobody remembered to restrict, and
              that is only legible if "open" is something the page says rather
              than something it implies by saying nothing. */}
          <Badge variant={restricted ? 'default' : 'outline'}>
            {restricted ? (
              <><Lock className="h-3 w-3" /> Restricted</>
            ) : (
              <><LockOpen className="h-3 w-3" /> Open</>
            )}
          </Badge>
        </CardTitle>
        <CardDescription>
          {restricted
            ? 'Only the members below can see this project or download its files.'
            : 'Any signed-in user can see this project and download its files.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-start gap-3">
        <Switch
          id="project-restricted"
          checked={restricted}
          disabled={!mayChange || isPending}
          onCheckedChange={toggle}
        />
        <div className="flex flex-col gap-1">
          <Label htmlFor="project-restricted">Restrict to members</Label>
          <p className="text-xs text-muted-foreground">
            {mayChange
              ? 'Takes effect immediately, for every page and every download.'
              : 'Changing this needs permission to manage this project’s members.'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

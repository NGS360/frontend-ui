import { useSuspenseQuery } from '@tanstack/react-query'
import { Building2, Calendar, Clock, Cog, FolderCheck, FolderSearch, ListChecks, Pencil, Plus, Tag, User, Zap } from 'lucide-react'
import { Outlet, createFileRoute } from '@tanstack/react-router'
import { getProjectByProjectId } from '@/client'
import { getProjectByProjectIdOptions } from '@/client/@tanstack/react-query.gen'
import { CopyableText } from '@/components/copyable-text'
import { ExecuteActionForm } from '@/components/execute-action-form'
import { FileBrowserDialog } from '@/components/file-browser'
import { TabLink, TabNav } from '@/components/tab-nav'
import { UpdateProjectForm } from '@/components/update-project-form'
import { ValidateManifestForm } from '@/components/validate-manifest-form'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { entityIcons } from '@/lib/entity-icons'
import { isValidHttpURL } from '@/lib/utils'

export const Route = createFileRoute('/_auth/projects/$project_id')({
  component: RouteComponent,
  loader: async ({ params, context }) => {
    const projectData = await getProjectByProjectId({
      path: { project_id: params.project_id },
      throwOnError: true,
    })

    await context.queryClient.prefetchQuery(
      getProjectByProjectIdOptions({
        path: { project_id: params.project_id }
      })
    )

    return ({
      crumb: projectData.data.name || projectData.data.project_id,
      includeCrumbLink: false,
    })
  }
})

function RouteComponent() {
  const { project_id } = Route.useParams()

  // Use React Query hook instead of loader data for automatic refetching
  const { data: project } = useSuspenseQuery(
    getProjectByProjectIdOptions({
      path: { project_id }
    })
  )

  // Two shapes mean "no usable date" and both must be treated the same. The API
  // sends null when MySQL handed it a zero-date it could not parse (see
  // ProjectPublic._nullify_invalid_datetime), and 1970-01-01 when a row carries
  // the epoch as a placeholder. Format only what is real, and let the absence of
  // a formatted string drive the rendering.
  const formatDate = (dateStr: string | null) =>
    dateStr && !dateStr.startsWith('1970-01-01')
      ? new Date(dateStr).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        })
      : null

  const hasCreator = project.created_by && project.created_by !== 'unknown'
  const createdAt = formatDate(project.created_at)
  const lastModified = formatDate(project.last_modified)

  const showMetadata = hasCreator || createdAt || lastModified

  return (
    <>
      <div className='flex flex-col gap-4'>
        {/* Header */}
        <div className='min-w-0'>
          <h1
            className='text-2xl @3xl:text-3xl font-extralight break-words'
            title={project.name ?? undefined}
          >
            {project.name}
          </h1>
          {showMetadata && (
            <div className='flex flex-col @2xl:flex-row @2xl:flex-wrap gap-1 @2xl:gap-3 mt-1 text-sm text-muted-foreground'>
              {hasCreator && <span className='inline-flex items-center gap-1'><User size={14} />Created by <span className='font-semibold'>{project.created_by}</span></span>}
              {createdAt && <span className='inline-flex items-center gap-1'><Calendar size={14} />Created on <span className='font-semibold'>{createdAt}</span></span>}
              {lastModified && <span className='inline-flex items-center gap-1'><Clock size={14} />Modified <span className='font-semibold'>{lastModified}</span></span>}
            </div>
          )}
        </div>

        {/* Grid for attributes and new content */}
        <div className='grid grid-cols-1 @5xl:grid-cols-2 gap-4'>
          {/* Attributes */}
          <Accordion
            type='single'
            collapsible
            className='w-full'
            defaultValue='attribute-grid'
          >
            <AccordionItem value='attribute-grid'>
              <AccordionTrigger className='uppercase font-light text-primary'>
                <span className='flex gap-2  items-center'>
                  <Tag size={14} /> Project attributes
                </span>
              </AccordionTrigger>
              <AccordionContent
                className='flex flex-col gap-4'
              >
                <div className='grid grid-flow-row gap-2 @xl:grid-cols-2 @5xl:grid-cols-2 @7xl:grid-cols-3'>
                  <Card
                    key={project.project_id}
                    className='border-0 shadow-none py-2 px-0 bg-transparent'
                  >
                    <CardContent className='px-0'>
                      <CardTitle className='uppercase text-sm font-light text-muted-foreground'>
                        Project ID
                      </CardTitle>
                      <CardDescription className='font-semibold '>
                        <CopyableText
                          text={project.project_id || ""}
                          variant={isValidHttpURL(project.project_id) ? 'hoverLink' : 'hover'}
                          size='sm'
                          className='[&>span]:truncate'
                        />
                      </CardDescription>
                    </CardContent>
                  </Card>
                  {project.attributes?.map((d) => (
                    <Card
                      key={d.key}
                      className='border-0 shadow-none py-2 px-0 bg-transparent'
                    >
                      <CardContent className='px-0'>
                        <CardTitle className='uppercase text-sm font-light text-muted-foreground'>
                          {d.key}
                        </CardTitle>
                        <CardDescription className='font-semibold '>
                          <CopyableText
                            text={d.value || ""}
                            variant={isValidHttpURL(d.value) ? 'hoverLink' : 'hover'}
                            size='sm'
                            className='[&>span]:truncate'
                          />
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <UpdateProjectForm
                  idPrefix={`project-${project.project_id}-update-project`}
                  projectId={project.project_id}
                  projectName={project.name}
                  projectCreatedBy={project.created_by}
                  projectAttributes={project.attributes}
                  trigger={
                    <Button variant='outline' className='w-full @3xl:w-fit'>
                      {!project.attributes || project.attributes.length === 0 ? (
                        <>
                          <Plus />
                          <span>Add attributes</span>
                        </>
                      ) : (
                        <>
                          <Pencil />
                          <span>Edit attributes</span>
                        </>
                      )}
                    </Button>
                  }
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* New accordion on the right */}
          <Accordion
            type='single'
            collapsible
            className='w-full'
            defaultValue='project-actions'
          >
            <AccordionItem value='project-actions'>
              <AccordionTrigger className='uppercase font-light text-primary'>
                <span className='flex gap-2 items-center'>
                  <Zap size={14} /> Project Actions
                </span>
              </AccordionTrigger>
              <AccordionContent className='flex flex-col gap-4'>
                <div className='grid grid-cols-1 @xl:grid-cols-2 @5xl:grid-cols-1 @7xl:grid-cols-2 gap-4'>
                  {/* Data Bucket */}
                  <FileBrowserDialog
                    trigger={(
                      <Card className='cursor-pointer transition-colors hover:bg-accent/50'>
                        <CardHeader>
                          <CardTitle className='flex items-center gap-2 text-lg'>
                            <FolderSearch className='size-5 text-primary' />
                            Data Bucket
                          </CardTitle>
                          <CardDescription>
                            Browse and manage files in the data bucket for this project
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    )}
                    rootPath={`${project.data_folder_uri}`}
                  />

                  {/* Results Bucket */}
                  <FileBrowserDialog
                    trigger={(
                      <Card className='cursor-pointer transition-colors hover:bg-accent/50'>
                        <CardHeader>
                          <CardTitle className='flex items-center gap-2 text-lg'>
                            <FolderCheck className='size-5 text-primary-2' />
                            Results Bucket
                          </CardTitle>
                          <CardDescription className='text-sm'>
                            View analysis results and outputs stored in the results bucket
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    )}
                    rootPath={`${project.results_folder_uri}`}
                  />

                  {/* Vendor Data */}
                  <ValidateManifestForm
                    idPrefix={`project-${project.project_id}-validate-manifest`}
                    projectId={project.project_id}
                    trigger={(
                      <Card className='cursor-pointer transition-colors hover:bg-accent/50'>
                        <CardHeader>
                          <CardTitle className='flex items-center gap-2 text-lg'>
                            <Building2 className='size-5 text-primary' />
                            Vendor Data
                          </CardTitle>
                          <CardDescription className='text-sm'>
                            Validate vendor manifest files and ingest vendor data into this project
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    )}
                  />

                  {/* Execute Action */}
                  <ExecuteActionForm
                    idPrefix={`project-${project_id}-execute-action`}
                    projectId={project_id}
                    trigger={(
                      <Card className='cursor-pointer transition-colors hover:bg-accent/50'>
                        <CardHeader>
                          <CardTitle className='flex items-center gap-2 text-lg'>
                            <Cog className='size-5 text-primary' />
                            Execute Action
                          </CardTitle>
                          <CardDescription className='text-sm'>
                            Execute pipelines and actions on this project
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Samples and jobs are sibling routes sharing one tab strip, so
            reaching the jobs table no longer means scrolling past a full page
            of samples, and each table is directly linkable. */}
        <TabNav>
          <div className='flex gap-2 flex-col @3xl:flex-row @3xl:items-center'>
            <TabLink
              to='/projects/$project_id/samples'
              params={{ project_id }}
            >
              <entityIcons.sample /><span>Samples</span>
            </TabLink>
            <TabLink
              to='/projects/$project_id/jobs'
              params={{ project_id }}
            >
              <ListChecks /><span>Jobs</span>
            </TabLink>
          </div>
        </TabNav>

        {/* Tab nav outlet */}
        <Outlet />
      </div>
    </>
  )
}

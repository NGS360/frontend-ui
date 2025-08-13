import { AxiosError } from 'axios'
import { Outlet, createFileRoute, getRouteApi, redirect, useNavigate } from '@tanstack/react-router'
import { FolderOpen, HardDriveDownload, LayoutDashboard, Zap } from 'lucide-react'
import { getProjectByProjectId } from '@/client'
import { CopyableText } from '@/components/copyable-text'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { IngestVendorForm } from '@/components/ingest-vendor-form'


export const Route = createFileRoute('/projects/$project_id')({
  component: RouteComponent,
  loader: async ({ params }) => {
    const projectData = await getProjectByProjectId({
      path: {
        project_id: params.project_id
      }
    })
    if (projectData.status !== 200 || projectData instanceof AxiosError) {
      alert("An error occurred: " + projectData.error?.detail || "An unknown error occurred.")
      throw redirect({ to: '/projects' })
    }
    return ({
      crumb: projectData.data.project_id,
      includeCrumbLink: true,
      project: projectData.data
    })
  }
})

function RouteComponent() {
  // Load project data
  const routeApi = getRouteApi('/projects/$project_id')
  const { project } = routeApi.useLoaderData()

  // Use mobile hook
  const isMobile = useIsMobile();

  const navigate = useNavigate();

  return (
    <>
      <div className='flex flex-col gap-4'>

        {/* Header and action bar */}
        <h1 className='text-3xl font-extralight'>{project.name}</h1>
        <div className='flex gap-2 flex-col md:flex-row md:h-9 md:items-center'>
          <CopyableText
            text={project.project_id}
            variant='default'
            className='font-semibold [&>span]:truncate'
          />
          {!isMobile && <Separator orientation='vertical' className='mr-2' />}
          <Button
            variant='outline'
            size='default'
            className='w-full md:w-auto'
            onClick={() => {
              navigate({
                to: '/projects/$project_id/overview',
                params: { project_id: project.project_id }
              })
            }}
          >
            <LayoutDashboard /><span>Overview</span>
          </Button>
          <Button
            variant='outline'
            size='default'
            className='w-full md:w-auto'
            onClick={() => {
              navigate({
                to: '/projects/$project_id/files',
                params: { project_id: project.project_id }
              })
            }}
          >
            <FolderOpen /> <span>Files</span>
          </Button>
          <IngestVendorForm
            trigger={(
              <Button
                variant='outline'
                size='default'
                className='w-full md:w-auto'
              >
                <HardDriveDownload /> <span>Ingest Vendor Data</span>
              </Button>
            )}
          />
          <Button
            variant='outline'
            size='default'
            className='w-full md:w-auto'
          >
            <Zap /> <span>Project Actions</span>
          </Button>
        </div>

        {/* Project tab navigation */}
        <Outlet />

      </div>
    </>
  )
}
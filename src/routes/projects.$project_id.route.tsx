import { AxiosError } from 'axios'
import { Outlet, createFileRoute, getRouteApi, redirect } from '@tanstack/react-router'
import { FolderOpen, HardDriveDownload, LayoutDashboard, Zap } from 'lucide-react'
import { getProjectByProjectId } from '@/client'
import { CopyableText } from '@/components/copyable-text'
import { Separator } from '@/components/ui/separator'
import { useIsMobile } from '@/hooks/use-mobile'
import { TabLink, TabNav } from '@/components/tab-nav'

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

  return (
    <>
      <div className='flex flex-col gap-4'>
        {/* Header and tab navigation */}
        <h1 className='text-3xl font-extralight'>{project.name}</h1>
        <div className='flex gap-2 flex-col md:flex-row md:h-9 md:items-center'>
          <CopyableText
            text={project.project_id}
            variant='default'
            className='font-semibold [&>span]:truncate'
          />
          {!isMobile && <Separator orientation='vertical' className='mr-2' />}
          <TabNav>
            <TabLink
              to='/projects/$project_id/overview'
              params={{ project_id: project.project_id }}
            >
              <LayoutDashboard /><span>Overview</span>
            </TabLink>
            <TabLink
              to='/projects/$project_id/files'
              params={{ project_id: project.project_id }}
            >
              <FolderOpen /><span>Files</span>
            </TabLink>
            <TabLink
              to='/projects/$project_id/ingest'
              params={{ project_id: project.project_id }}
            >
              <HardDriveDownload /> <span>Ingest Vendor Data</span>
            </TabLink>
            <TabLink
              to='/projects/$project_id/actions'
              params={{ project_id: project.project_id }}
            >
              <Zap /> <span>Project Actions</span>
            </TabLink>            
          </TabNav>
          
        </div>
        {/* Tab nav outlet */}
        <Outlet />
      </div>
    </>
  )
}
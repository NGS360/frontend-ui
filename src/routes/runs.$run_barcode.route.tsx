import { Outlet, createFileRoute, getRouteApi, redirect } from '@tanstack/react-router'
import { AxiosError } from 'axios'
import { ChartBar, FileSpreadsheet, FolderOpen, PlayCircle, RotateCw, Upload } from 'lucide-react'
import { getRun } from '@/client'
import { TabLink, TabNav } from '@/components/tab-nav'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export const Route = createFileRoute('/runs/$run_barcode')({
  component: RouteComponent,
  loader: async ({ params }) => {
    // Get run data
    const runData = await getRun({
      path: {
        run_barcode: params.run_barcode
      }
    })
    if (runData.status !== 200 || runData instanceof AxiosError) {
      alert("An error occurred: " + runData.error?.detail || "An unknown error occurred.")
      throw redirect({ to: '/runs' })
    }

    return ({
      crumb: runData.data.barcode,
      includeCrumbLink: true,
      run: runData.data
    })
  }
})

function RouteComponent() {
  // Load project data
  const routeApi = getRouteApi('/runs/$run_barcode')
  const { run } = routeApi.useLoaderData()

  return (
    <>
      <div className='flex flex-col gap-4'>
        {/* Header and tab navigation */}
        <h1 className='text-3xl font-extralight overflow-x-clip overflow-ellipsis'>{run.barcode}</h1>
        <p className='text-muted-foreground'>{run.experiment_name}</p>
        <div className='flex gap-4'>
          <TabNav className="justify-between">
            <div className='flex gap-2 flex-col md:flex-row md:items-center'>
              <TabLink
                to='/runs/$run_barcode/samplesheet'
                params={{ run_barcode: run.barcode as string }}
              >
                <FileSpreadsheet /><span>Samplesheet</span>
              </TabLink>
              <TabLink
                to='/runs/$run_barcode/indexqc'
                params={{ run_barcode: run.barcode as string }}
              >
                <ChartBar /><span>IndexQC</span>
              </TabLink>
            </div>
            <div className='md:flex md:gap-2'>
              <div className='flex gap-2 items-center'>
                <span>
                  Status: {run.status}
                </span>
                <div className='h-4'><Separator orientation='vertical' /></div>
                <div className='flex gap-0 items-center'>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                      >
                        <RotateCw />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Re-sync Run
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                      >
                        <FolderOpen />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Browse Run Folder
                    </TooltipContent>
                  </Tooltip>                        
                </div>
              </div>
              <div className='flex gap-2'>
                <Button
                  className='flex-1 min-w-0 md:flex-none md:w-auto'
                  variant='primary2'
                >
                  <Upload /> Upload File
                </Button>
                <Button
                  className='flex-1 min-w-0 md:flex-none md:w-auto'
                  variant='primary2'
                >
                  <PlayCircle /> Demultiplex Run
                </Button>
              </div>
            </div>
          </TabNav>
        </div>
        {/* Tab nav outlet */}
        <Outlet />
      </div>
    </>
  )
}

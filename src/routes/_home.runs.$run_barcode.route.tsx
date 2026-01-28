import { Outlet, createFileRoute, getRouteApi, redirect } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { ChartBar, ChevronDown, FileSpreadsheet, FolderOpen, Loader2, PlayCircle, RotateCw, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import type { ChangeEvent } from 'react';
import type { DemuxWorkflowConfig } from '@/client'
import { getDemultiplexWorkflowConfig, getRun, listDemultiplexWorkflows } from '@/client'
import { getRunSamplesheetQueryKey, postRunSamplesheetMutation } from '@/client/@tanstack/react-query.gen'
import { ExecuteToolForm } from '@/components/execute-demux-job-form'
import { TabLink, TabNav } from '@/components/tab-nav'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { FileBrowserDialog } from '@/components/file-browser';
import { FullscreenSpinner } from '@/components/spinner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export const Route = createFileRoute('/_home/runs/$run_barcode')({
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
      includeCrumbLink: false,
      run: runData.data
    })
  }
})

function RouteComponent() {
  // Load run data
  const routeApi = getRouteApi('/_home/runs/$run_barcode')
  const { run } = routeApi.useLoaderData()
  const queryClient = useQueryClient()

  // Fetch available demultiplex workflows
  const toolsQuery = useQuery({
    queryKey: ['listDemultiplexWorkflows'],
    queryFn: async () => {
      const result = await listDemultiplexWorkflows({ throwOnError: true })
      return result.data
    }
  })
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedToolConfig, setSelectedToolConfig] = useState<DemuxWorkflowConfig | null>(null)
  const [toolDialogOpen, setToolDialogOpen] = useState(false)

  // Handle workflow selection
  const handleToolSelect = async (workflow: string) => {
    try {
      const result = await getDemultiplexWorkflowConfig({
        path: {
          workflow_id: workflow
        },
        query: {
          run_barcode: run.barcode as string
        },
        throwOnError: true
      })
      setSelectedToolConfig(result.data)
      setToolDialogOpen(true)
    } catch (error) {
      console.error('Error fetching workflow config:', error)
      toast.error(`Failed to fetch config for workflow: ${workflow}`)
    }
    setDropdownOpen(false)
  }

  // File upload mutation
  const { mutate, isPending } = useMutation({
    ...postRunSamplesheetMutation(),
    onSuccess: () => {
      // Invalidate the query for the run to refresh samplesheet info
      queryClient.invalidateQueries({
        queryKey: getRunSamplesheetQueryKey({
          path: {
            run_barcode: run.barcode as string
          }
        })
      });
      toast.success(`Samplesheet for run ${run.barcode} uploaded successfully`);
    },
    onError: (uploadError) => {
      console.error(uploadError);
      toast.error('Failed to upload file');
    }
  })

  // Samplesheet file upload
  const inputRef = useRef<HTMLInputElement>(null)
  const handleClick = () => {
    inputRef.current?.click()
  }
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length) {
      const file = e.target.files[0]
      console.log(file)
      
      // Upload file using the mutation
      mutate({ 
        path: {
          run_barcode: run.barcode as string
        },
        body: {
          file: file
        }
      });
      
      // Reset the input value so the same file can be uploaded again
      e.target.value = '';
    }
  }

    // Show loading spinner
    if (isPending) {
      return <FullscreenSpinner variant='ellipsis' />
    }

  return (
    <>
      {/* Tool Execution Dialog */}
      {selectedToolConfig && (
        <ExecuteToolForm
          toolConfig={selectedToolConfig}
          runBarcode={run.barcode as string}
          isOpen={toolDialogOpen}
          onOpenChange={setToolDialogOpen}
        />
      )}

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
                        onClick={() => {
                          console.log('Re-sync run')
                        }}
                      >
                        <RotateCw />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Re-sync Run
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <FileBrowserDialog
                      trigger={(
                        <TooltipTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                          >
                            <FolderOpen />
                          </Button>
                        </TooltipTrigger>
                      )}
                      rootPath={`${run.run_folder_uri}/`}
                    />
                    <TooltipContent>
                      Browse Run Folder
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className='flex gap-2'>
                <input
                  id='samplesheetFileUpload'
                  type='file'
                  ref={inputRef}
                  className='hidden'
                  onChange={handleChange}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                      <Button
                        className='flex-1 min-w-0 md:flex-none md:w-auto'
                        variant='primary2'
                        onClick={handleClick}
                      >
                        <Upload /> Upload file
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent className='max-w-45 text-wrap text-center'>
                    Drop file on the page or click here to upload a new samplesheet
                  </TooltipContent>
                </Tooltip>
                <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className='flex-1 min-w-0 md:flex-none md:w-auto'
                      variant='primary2'
                      disabled={toolsQuery.isLoading}
                    >
                      {toolsQuery.isLoading ? (
                        <>
                          <Loader2 className="animate-spin" /> Getting tools...
                        </>
                      ) : (
                        <>
                          <PlayCircle /> Demultiplex Run <ChevronDown className="ml-1" />
                        </>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {toolsQuery.data?.map((tool) => (
                      <DropdownMenuItem
                        key={tool}
                        onClick={() => handleToolSelect(tool)}
                      >
                        {tool}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
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

import { Outlet, createFileRoute, getRouteApi, redirect } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { ChartBar, FileSpreadsheet, FolderOpen, PlayCircle, RotateCw, Upload } from 'lucide-react'
import { useRef } from 'react'
import { toast } from 'sonner'
import type { ChangeEvent } from 'react';
import { getRun } from '@/client'
import { createFileMutation, getRunSamplesheetQueryKey } from '@/client/@tanstack/react-query.gen'
import { TabLink, TabNav } from '@/components/tab-nav'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { FileBrowserDialog } from '@/components/file-browser';

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
      includeCrumbLink: false,
      run: runData.data
    })
  }
})

function RouteComponent() {
  // Load project data
  const routeApi = getRouteApi('/runs/$run_barcode')
  const { run } = routeApi.useLoaderData()
  const queryClient = useQueryClient()

  // File upload mutation
  const { mutate } = useMutation({
    ...createFileMutation(),
    onSuccess: (data) => {
      console.log(data);
      // Invalidate the query for the run to refresh samplesheet info
      queryClient.invalidateQueries({
        queryKey: getRunSamplesheetQueryKey({
          path: {
            run_barcode: run.barcode as string
          }
        })
      });
      toast.success(`${data.filename} for run ${run.barcode} uploaded successfully`);
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
        body: {
          filename: file.name,
          content: file,
          entity_type: "run",
          entity_id: run.barcode as string,
          file_type: "samplesheet",
          created_by: "current_user",
          description: "Uploaded via UI",
          is_public: false
        }
      });
      
      // Reset the input value so the same file can be uploaded again
      e.target.value = '';
    }
  }

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
                      queryParams={{
                        storage_root: `storage/run`,
                        directory_path: run.barcode || ''
                      }}
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

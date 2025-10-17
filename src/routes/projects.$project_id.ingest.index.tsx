import { Link, createFileRoute, getRouteApi } from '@tanstack/react-router'
import { useReducer } from 'react'
import { Check, FileInput, Folder, Upload } from 'lucide-react'
import { toast } from 'sonner'
import type { VendorPublic } from '@/client'
import type { ComboBoxOption } from '@/components/combobox'
import { getVendors } from '@/client'
import { ComboBox } from '@/components/combobox'
import { FileBrowserDialog } from '@/components/file-browser'
import { FileUpload } from '@/components/file-upload'
import { Spinner } from '@/components/spinner'
import { Stepper } from '@/components/stepper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAllPaginated } from '@/hooks/use-all-paginated'

export const Route = createFileRoute('/projects/$project_id/ingest/')({
  component: RouteComponent,
})

function RouteComponent() {
  // Load project data
  const routeApi = getRouteApi('/projects/$project_id')
  const { project } = routeApi.useLoaderData()
  
  // Stepper state managed by useReducer
  type State = {
    selectedVendor: { value: string; label?: string };
    selectedFile: string;
    validManifest: boolean;
    activeStep: number;
  };
  type Action =
    | { type: 'SET_VENDOR'; value: string; label?: string }
    | { type: 'SET_FILE'; value: string }
    | { type: 'SET_VALID_MANIFEST'; value: boolean }
    | { type: 'SET_ACTIVE_STEP'; value: number };

  const initialState: State = {
    selectedVendor: { value: '', label: '' },
    selectedFile: '',
    validManifest: false,
    activeStep: 0,
  };

  function stepperReducer(state: State, action: Action): State {
    switch (action.type) {
      case 'SET_VENDOR': {
        return {
          ...state,
          selectedVendor: { value: action.value, label: action.label },
          selectedFile: '',
          validManifest: false,
          activeStep: action.value ? 1 : 0,
        };
      }
      case 'SET_FILE': {
        return {
          ...state,
          selectedFile: action.value,
          validManifest: false,
          activeStep: action.value ? 2 : 1,
        };
      }
      case 'SET_VALID_MANIFEST': {
        return {
          ...state,
          validManifest: action.value,
          activeStep: action.value ? 3 : state.activeStep,
        };
      }
      case 'SET_ACTIVE_STEP': {
        return {
          ...state,
          activeStep: action.value,
        };
      }
      default:
        return state;
    }
  }

  const [state, dispatch] = useReducer(stepperReducer, initialState);

  // Fetch all vendors using sequential page fetch
  const { data: vendors, isLoading: isLoadingVendors } = useAllPaginated<VendorPublic>({
    queryKey: ['vendors', 'all'],
    fetcher: getVendors,
    perPage: 100
  })

  // Transform vendors data into ComboBox options
  const vendorOptions: Array<ComboBoxOption> = vendors?.map(vendor => ({
    label: `${vendor.name} (${vendor.vendor_id})`,
    value: vendor.bucket || '',
    description: vendor.description,
  })) ?? []

  return (
    <>
      <div className='flex flex-col gap-12 max-w-[40rem] mt-4 mb-15'>

        {/* Stepper component */}
        <Stepper
          activeStep={state.activeStep}
          showFutureSteps={true}
          steps={[ 
            {
              label: "Select Source",
              description: "Select source bucket for FASTQ file ingestion",
              content: (
                <>
                  <div className='flex flex-col gap-6'>
                    {/* Vendor Bucket Selected */}
                      <div className="flex flex-col gap-2">
                        <div className='flex flex-col gap-2 md:flex-row md:gap-2'>
                          <div className='flex flex-col flex-1'>
                            <ComboBox
                              id="vendorBucket"
                              options={vendorOptions}
                              placeholder={isLoadingVendors ? "Loading vendors..." : "Select source bucket"}
                              value={state.selectedVendor.value}
                              onChange={(value: string, label?: string) => dispatch({ type: 'SET_VENDOR', value, label })}
                              disabled={isLoadingVendors}
                            />
                            <div className='flex flex-col gap-1 text-xs text-muted-foreground mt-1 md:flex-row md:justify-end md:items-center'>
                              <span>Not seeing your vendor's bucket? </span>
                              <Link
                                to='/admin/vendors'
                                className="text-primary hover:underline"
                              >
                                Add a vendor
                              </Link>
                            </div>
                          </div>

                          <Tooltip>
                            <FileBrowserDialog
                              trigger={(
                                <TooltipTrigger asChild>
                                  <Button
                                    variant='outline'
                                    disabled={state.selectedVendor.value === ''}
                                    className='w-full md:w-auto'
                                  >
                                    <Folder /> Browse
                                  </Button>
                                </TooltipTrigger>
                              )}
                              rootPath={`${state.selectedVendor.value}/${project.project_id}/`}
                            />
                            <TooltipContent>
                              Browse {state.selectedVendor.value}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    
                  </div>
                </>
              ),
            },
            {
              label: "Ingest",
              description: "Choose or upload a manifest file describing files to ingest",
              content: (
                <>
                  {/* Step-2 */}
                  {(state.activeStep === 1) && (
                    <>
                    {/* TODO: call APIs */}
                      {false ? (
                        <div className='flex flex-col gap-2'>
                          <div className='flex flex-col gap-2 md:flex-row md:items-center md:gap-2'>
                            <Input
                              readOnly
                              value={`${state.selectedVendor.value}/path/to/manifest.csv`}
                              className='md:flex-1'
                            />
                            {/* TODO: Replace with validate output */}
                            {false ? (
                              <div className='flex items-center gap-1'>
                                <Check className='text-success size-4' />
                                <span className='text-success text-sm'> Valid</span>
                              </div>
                            ) : (
                              <div className='flex items-center gap-1'>
                                <Spinner variant='ring' />
                                <span className='text-muted-foreground text-sm'> Validating...</span>
                              </div>
                            )}
                          </div>

                          <div className='flex flex-col gap-2 md:flex-row md:justify-end'>
                            <Button
                              variant='outline'
                              className='w-full md:w-auto'
                            >
                              <Upload /> Upload new manifest
                            </Button>

                            <Button
                              disabled={!state.validManifest}
                              onClick={() => {
                                toast.success(`Successfully ingested ${state.selectedFile} into project ${project.project_id}`);
                              }}
                              className='w-full md:w-auto'
                            >
                              <FileInput /> Ingest
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 md:flex-1">
                          <FileUpload
                            // TODO: Add on upload handler
                            displayComponent={(
                              <div className="flex flex-col items-center justify-center">
                                <div className="font-semibold">Drag or click to upload file</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {`to ${state.selectedVendor.label} bucket`}
                                </div>
                              </div>
                            )}
                          />
                        </div>
                      )}
                    </>
                  )}
                </>
              )
            }
          ]}
        />
      </div>
    </>
  )
}

import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { useEffect, useReducer, useState } from 'react'
import clsx from 'clsx'
import { Briefcase, Building, Check, ClipboardCheck, File, FileInput, Folder, MousePointer2 } from 'lucide-react'
import { toast } from 'sonner'
import type { ComboBoxOption } from '@/components/combobox'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ComboBox } from '@/components/combobox'
import { Button } from '@/components/ui/button'
import { FileBrowserDialog } from '@/components/file-browser'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { FileUpload } from '@/components/file-upload'
import { Separator } from '@/components/ui/separator'
import { Stepper } from '@/components/stepper'

export const Route = createFileRoute('/projects/$project_id/ingest/')({
  component: RouteComponent,
})

function RouteComponent() {
  // Load project data
  const routeApi = getRouteApi('/projects/$project_id')
  const { project } = routeApi.useLoaderData()
  
  // Stepper state managed by useReducer
  type State = {
    sourceIsData: boolean | undefined;
    selectedVendor: { value: string; label?: string };
    selectedFile: string;
    validManifest: boolean;
    activeStep: number;
  };
  type Action =
    | { type: 'SET_SOURCE'; value: 'data' | 'vendor' | undefined }
    | { type: 'SET_VENDOR'; value: string; label?: string }
    | { type: 'SET_FILE'; value: string }
    | { type: 'SET_VALID_MANIFEST'; value: boolean }
    | { type: 'SET_ACTIVE_STEP'; value: number };

  const initialState: State = {
    sourceIsData: undefined,
    selectedVendor: { value: '', label: '' },
    selectedFile: '',
    validManifest: false,
    activeStep: 0,
  };

  function stepperReducer(state: State, action: Action): State {
    switch (action.type) {
      case 'SET_SOURCE': {
        if (action.value === 'data') {
          return {
            ...state,
            sourceIsData: true,
            selectedVendor: { value: '', label: '' },
            selectedFile: '',
            validManifest: false,
            activeStep: 1,
          };
        } else if (action.value === 'vendor') {
          return {
            ...state,
            sourceIsData: false,
            selectedVendor: { value: '', label: '' },
            selectedFile: '',
            validManifest: false,
            activeStep: 0,
          };
        } else {
          return {
            ...state,
            sourceIsData: undefined,
            selectedVendor: { value: '', label: '' },
            selectedFile: '',
            validManifest: false,
            activeStep: 0,
          };
        }
      }
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

  // Load vendor options
  const [vendorOptions, setVendorOptions] = useState<Array<ComboBoxOption>>();
  useEffect(() => {
    const fetchVendors = async () => {
      const res = await fetch('/data/example_vendors.json')
      if (!res.ok) {
        throw new Error('Unable to fetch vendor data')
      }
      const options: Array<ComboBoxOption> = await res.json()
      const newOptions = options.map(opt => ({
        label: `${opt.label} (${opt.value})`,
        value: opt.value,
        description: opt.description,
      }))
      setVendorOptions(newOptions)
    }
    fetchVendors()
  }, [])


  // Example vendor bucket data
  const [vendorBucketData, setVendorBucketData] = useState();
  useEffect(() => {
    const fetchVendorBucketData = async () => {
      const res = await fetch('/data/example_project_data.json')
      if (!res.ok) {
        throw new Error('Unable to fetch vendor bucket data')
      }
      const data = await res.json()
      setVendorBucketData(data)
    }
    fetchVendorBucketData()
  }, [])

  return (
    <>
      <div className='flex flex-col gap-12 max-w-[40rem] mt-4 mb-15'>

        {/* Stepper component */}
        <Stepper
          activeStep={state.activeStep}
          showFutureSteps={true}
          steps={[ 
            {
              label: "Source",
              description: "Select data or vendor bucket",
              content: (
                <>
                  <div className='flex flex-col gap-6'>
                    <div className='flex flex-col gap-2 sm:grid sm:grid-cols-2'>
                      <Card
                        className={clsx(
                          'row-span-1 cursor-pointer',
                          'hover:border-primary hover:bg-primary/5',
                          state.sourceIsData ? 'border-primary bg-primary/5' : ''
                        )}
                        onClick={() => dispatch({ type: 'SET_SOURCE', value: 'data' })}
                      >
                        <CardHeader>
                          <CardTitle
                            className={clsx(
                              'flex items-center gap-2',
                              state.sourceIsData ? 'text-primary' : ''
                            )}
                          >
                            <Briefcase /> Data Bucket
                          </CardTitle>
                          <CardDescription>
                            Select manifest file from the internal data bucket.
                          </CardDescription>
                          <CardAction >
                            <Input
                              type='radio'
                              checked={state.sourceIsData === true}
                              onChange={e => dispatch({ type: 'SET_SOURCE', value: e.target.checked ? 'data' : undefined })}
                              className='accent-primary'
                            >
                            </Input>
                          </CardAction>
                        </CardHeader>
                      </Card>
                      <Card
                        className={clsx(
                          'row-span-1 cursor-pointer',
                          'hover:border-primary hover:bg-primary/5',
                          state.sourceIsData === false ? 'border-primary bg-primary/5' : ''
                        )}
                        onClick={() => dispatch({ type: 'SET_SOURCE', value: 'vendor' })}
                      >
                        <CardHeader>
                          <CardTitle
                            className={clsx(
                              'flex items-center gap-2',
                              state.sourceIsData === false ? 'text-primary' : ''
                            )}
                          >
                            <Building /> Vendor Bucket
                          </CardTitle>
                          <CardDescription>
                            Select manifest file from a vendor bucket.
                          </CardDescription>
                          <CardAction>
                            <Input
                              type='radio'
                              checked={state.sourceIsData === false}
                              onChange={e => dispatch({ type: 'SET_SOURCE', value: e.target.checked ? 'vendor' : undefined })}
                              className='accent-primary'
                            >
                            </Input>
                          </CardAction>
                        </CardHeader>
                      </Card>
                    </div>

                    {/* Vendor Bucket Selected */}
                    {state.sourceIsData === false && (
                      <div className="flex flex-col gap-2">
                        <Label>Which vendor bucket?</Label>
                        <div className='flex gap-2'>
                          <div className='flex flex-col flex-1'>
                            <ComboBox
                              id="vendorBucket"
                              options={vendorOptions ?? []}
                              placeholder="Select vendor bucket"
                              value={state.selectedVendor.value}
                              onChange={(value: string, label?: string) => dispatch({ type: 'SET_VENDOR', value, label })}
                            />
                          </div>

                          <Tooltip>
                            <FileBrowserDialog
                              trigger={(
                                <TooltipTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    disabled={state.selectedVendor.value === ''}
                                  >
                                    <Folder /> Browse
                                  </Button>
                                </TooltipTrigger>
                              )}
                              queryParams={{
                                directory_path: state.selectedVendor.value,
                                storage_root: 'storage/vendor'
                              }}
                            />
                            <TooltipContent>
                              Browse Vendor Bucket
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ),
            },
            {
              label: "Manifest",
              description: "Choose or upload manifest file",
              content: (
                <>
                  {/* Step-2 */}
                  {(state.selectedVendor.value !== '' || state.sourceIsData === true) && (
                    <div className='flex flex-col gap-4'>
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-2">

                        {/* Left box */}
                        <div className="flex flex-col gap-2 md:flex-1">
                          <FileBrowserDialog
                            trigger={(
                              <div
                                className="relative flex items-center justify-center text-center w-full h-48 border-2 rounded-lg cursor-pointer hover:bg-primary/5 hover:border-primary"
                                onClick={() => dispatch({ type: 'SET_FILE', value: '/path/to/selected_manfiest_file.csv' })}
                              >
                                <MousePointer2 className="absolute inset-0 z-[-1] text-accent w-full h-full" />
                                <div className="text-center">
                                  <div className="font-semibold">Click to select file</div>
                                  <div className="text-sm text-muted-foreground">
                                    {state.sourceIsData ? 'from internal data bucket' : `from ${state.selectedVendor.label} bucket`}
                                  </div>
                                </div>
                              </div>
                            )}
                            queryParams={{
                              directory_path: state.sourceIsData ? project.project_id : state.selectedVendor.value,
                              storage_root: state.sourceIsData ? 'storage/project' : 'storage/vendor'
                            }}
                          />
                        </div>

                        {/* Separator for small screens: shows line with OR overlay, hidden at md and up */}
                        <div className="relative py-8 md:hidden">
                          <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background px-6 text-muted-foreground">
                            OR
                          </span>
                          <Separator />
                        </div>

                        {/* Separator for md and up: just OR text centered between the boxes, no line */}
                        <div className="hidden md:flex md:items-center md:justify-center">
                          <span className="bg-transparent px-2 text-muted-foreground">OR</span>
                        </div>

                        {/* Right box */}
                        <div className="flex flex-col gap-2 md:flex-1">
                          <FileUpload
                            // TODO: Add on upload handler
                            displayComponent={(
                              <div className="flex flex-col items-center justify-center">
                                <div className="font-semibold">Drag or click to upload file</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {state.sourceIsData 
                                    ? 'upload to internal data bucket' 
                                    : `to ${state.selectedVendor.label} bucket`}
                                </div>
                              </div>
                            )}
                          />
                        </div>
                      </div>

                    </div>
                  )}
                </>
              )
            },
            {
              label: "Ingest",
              description: "Ingest a validated manifest",
              content: (
                <>
                  {/* Selected file */}
                  {state.selectedFile !== '' && (
                    <div className='flex flex-col gap-4'>
                      <div className='border-1 rounded-lg border-primary/25 p-2'>
                        <div className='flex items-center justify-between gap-8'>
                          <div className='flex items-center gap-2 text-primary whitespace-normal text-wrap break-all'>
                            <File className='size-4' />
                            {state.selectedFile}
                          </div>
                          <Button
                            variant='link'
                            className='text-destructive'
                            onClick={() => {
                              dispatch({ type: 'SET_FILE', value: '' });
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>

                      <div className='flex flex-col gap-2 justify-end sm:flex-row'>
                        <Button
                          variant='secondary'
                          onClick={() => { 
                            dispatch({ type: 'SET_VALID_MANIFEST', value: true });
                          }}
                        >
                          {state.validManifest
                            ? (
                              <><Check /> Valid</>
                            ) : (
                              <><ClipboardCheck /> Validate</>
                            )}
                        </Button>
                        <Button
                          disabled={!state.validManifest}
                          onClick={() => {
                            toast.success(`Successfully ingested ${state.selectedFile} into project ${project.project_id}`);
                          }}
                        >
                          <FileInput /> Ingest
                        </Button>
                      </div>
                    </div>
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

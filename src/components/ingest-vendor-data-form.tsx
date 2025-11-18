import { Check, FileInput, Folder } from 'lucide-react'
import { useReducer } from 'react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import type React from 'react'
import type { JSX } from 'react'
import type { VendorPublic } from '@/client/types.gen'
import type { ComboBoxOption } from '@/components/combobox'
import { getVendors } from '@/client'
import { ComboBox } from '@/components/combobox'
import { FileBrowserDialog } from '@/components/file-browser'
import { FileUpload } from '@/components/file-upload'
import { Stepper } from '@/components/stepper'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAllPaginated } from '@/hooks/use-all-paginated'

interface IngestVendorDataFormProps {
  /** Trigger for the Sheet component */
  trigger: JSX.Element
  /** Project ID for file paths */
  projectId: string
}

export const IngestVendorDataForm: React.FC<IngestVendorDataFormProps> = ({
  trigger,
  projectId
}) => {
  // Stepper state managed by useReducer
  type State = {
    selectedVendor: { value: string; label?: string };
    selectedFile: string;
    validManifest: boolean;
    activeStep: number;
    manifestOption: 'existing' | 'upload';
  };
  type Action =
    | { type: 'SET_VENDOR'; value: string; label?: string }
    | { type: 'SET_FILE'; value: string }
    | { type: 'SET_VALID_MANIFEST'; value: boolean }
    | { type: 'SET_ACTIVE_STEP'; value: number }
    | { type: 'SET_MANIFEST_OPTION'; value: 'existing' | 'upload' };

  const initialState: State = {
    selectedVendor: { value: '', label: '' },
    selectedFile: '',
    validManifest: false,
    activeStep: 0,
    manifestOption: 'existing',
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
      case 'SET_MANIFEST_OPTION': {
        return {
          ...state,
          manifestOption: action.value,
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
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Ingest Vendor Data</SheetTitle>
          <SheetDescription>
            Upload and validate vendor manifest files for data ingestion
          </SheetDescription>
          <div className='flex flex-col gap-12 mt-6'>
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
                                rootPath={`${state.selectedVendor.value}/${projectId}/`}
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
                  label: "Choose manifest",
                  description: "Choose or upload a manifest file describing files to ingest",
                  content: (
                    <>
                      {(state.activeStep === 1) && (
                        <div className='flex flex-col gap-4'>
                          <RadioGroup
                            value={state.manifestOption}
                            onValueChange={(value) => dispatch({ type: 'SET_MANIFEST_OPTION', value: value as 'existing' | 'upload' })}
                            className='flex flex-col gap-4'
                          >
                            <Card className={`relative cursor-pointer ${state.manifestOption === 'existing' ? 'border-primary ring-2 ring-primary ring-offset-2' : ''}`}>
                              <CardHeader>
                                <Label htmlFor='existing' className='flex items-start gap-3 cursor-pointer'>
                                  <RadioGroupItem value='existing' id='existing' className='mt-1' />
                                  <div className='flex flex-col gap-1.5'>
                                    <CardTitle className='text-base'>Use existing manifest</CardTitle>
                                    <CardDescription className='text-xs'>
                                      Select a manifest file already in the vendor bucket
                                    </CardDescription>
                                  </div>
                                </Label>
                              </CardHeader>
                            </Card>

                            <Card className={`relative cursor-pointer ${state.manifestOption === 'upload' ? 'border-primary ring-2 ring-primary ring-offset-2' : ''}`}>
                              <CardHeader>
                                <Label htmlFor='upload' className='flex items-start gap-3 cursor-pointer'>
                                  <RadioGroupItem value='upload' id='upload' className='mt-1' />
                                  <div className='flex flex-col gap-1.5'>
                                    <CardTitle className='text-base'>Upload new manifest</CardTitle>
                                    <CardDescription className='text-xs'>
                                      Upload a new manifest file to the vendor bucket
                                    </CardDescription>
                                  </div>
                                </Label>
                              </CardHeader>
                            </Card>
                          </RadioGroup>

                          {state.manifestOption === 'existing' ? (
                            <div className='flex flex-col gap-2'>
                              <div className='flex flex-col gap-2 md:flex-row md:items-center md:gap-2'>
                                <Input
                                  readOnly
                                  value={`${state.selectedVendor.value}/path/to/manifest.csv`}
                                  className='md:flex-1'
                                />
                                <div className='flex items-center gap-1'>
                                  <Check className='text-success size-4' />
                                  <span className='text-success text-sm'> Valid</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <FileUpload
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
                        </div>
                      )}
                    </>
                  )
                }
              ]}
            />
          </div>
        </SheetHeader>
        <SheetFooter>
          {state.activeStep === 1 && (
            <Button
              disabled={false} // {!state.validManifest}
              onClick={() => {
                toast.success(`Successfully ingested ${state.selectedFile} into project ${projectId}`);
              }}
              className='w-full md:w-auto'
            >
              <FileInput /> Ingest
            </Button>
          )}
          
          <SheetClose asChild>
            <Button
              variant="secondary"
              className='w-full md:w-auto'
            >
              Cancel
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

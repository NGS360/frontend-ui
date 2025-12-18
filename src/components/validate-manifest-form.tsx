import { Check, Folder } from 'lucide-react'
import { useCallback, useEffect, useReducer } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import type React from 'react'
import type { JSX } from 'react'
import type { ManifestUploadResponse, VendorPublic } from '@/client/types.gen'
import type { ComboBoxOption } from '@/components/combobox'
import { getLatestManifest, getVendors } from '@/client'
import { getLatestManifestQueryKey, uploadManifestMutation } from '@/client/@tanstack/react-query.gen'
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

interface ValidateManifestFormProps {
  /** Trigger for the Sheet component */
  trigger: JSX.Element
  /** Project ID for file paths */
  projectId: string
}

export const ValidateManifestForm: React.FC<ValidateManifestFormProps> = ({
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
    uploadedFile: string;
    latestManifestPath: string | null;
    isLoadingManifest: boolean;
    manifestError: boolean;
  };
  type Action =
    | { type: 'SET_VENDOR'; value: string; label?: string }
    | { type: 'SET_FILE'; value: string }
    | { type: 'SET_VALID_MANIFEST'; value: boolean }
    | { type: 'SET_ACTIVE_STEP'; value: number }
    | { type: 'SET_MANIFEST_OPTION'; value: 'existing' | 'upload' }
    | { type: 'SET_UPLOADED_FILE'; value: string }
    | { type: 'SET_LATEST_MANIFEST_PATH'; value: string | null }
    | { type: 'SET_IS_LOADING_MANIFEST'; value: boolean }
    | { type: 'SET_MANIFEST_ERROR'; value: boolean };

  const initialState: State = {
    selectedVendor: { value: '', label: '' },
    selectedFile: '',
    validManifest: false,
    activeStep: 0,
    manifestOption: 'existing',
    uploadedFile: '',
    latestManifestPath: null,
    isLoadingManifest: false,
    manifestError: false,
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
          latestManifestPath: null,
          uploadedFile: '',
          manifestError: false,
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
          uploadedFile: '',
          latestManifestPath: null,
          manifestError: false,
        };
      }
      case 'SET_UPLOADED_FILE': {
        return {
          ...state,
          uploadedFile: action.value,
        };
      }
      case 'SET_LATEST_MANIFEST_PATH': {
        return {
          ...state,
          latestManifestPath: action.value,
        };
      }
      case 'SET_IS_LOADING_MANIFEST': {
        return {
          ...state,
          isLoadingManifest: action.value,
        };
      }
      case 'SET_MANIFEST_ERROR': {
        return {
          ...state,
          manifestError: action.value,
        };
      }
      default:
        return state;
    }
  }

  const [state, dispatch] = useReducer(stepperReducer, initialState);

  // Effect to fetch latest manifest when "existing" option is selected
  useEffect(() => {
    if (state.manifestOption === 'existing' && state.selectedVendor.value && !state.latestManifestPath && !state.isLoadingManifest) {
      dispatch({ type: 'SET_IS_LOADING_MANIFEST', value: true });
      
      getLatestManifest({
        query: {
          s3_path: `${state.selectedVendor.value}/${projectId}/`
        }
      }).then((response) => {
        // Check if response has status 204 (no content)
        if (response.status === 204) {
          dispatch({ type: 'SET_LATEST_MANIFEST_PATH', value: 'There is no matching manifest file associated with this vendor' });
          dispatch({ type: 'SET_MANIFEST_ERROR', value: true });
        } else if (response.data) {
          dispatch({ type: 'SET_LATEST_MANIFEST_PATH', value: response.data });
          dispatch({ type: 'SET_MANIFEST_ERROR', value: false });
        }
        dispatch({ type: 'SET_IS_LOADING_MANIFEST', value: false });
      }).catch((error) => {
        alert(`Error fetching latest manifest: ${error.message || 'Unknown error'}`);
        dispatch({ type: 'SET_MANIFEST_ERROR', value: true });
        dispatch({ type: 'SET_IS_LOADING_MANIFEST', value: false });
      });
    }
  }, [state.manifestOption, state.selectedVendor.value, projectId, state.latestManifestPath, state.isLoadingManifest]);

  const queryClient = useQueryClient();

  // Manifest upload mutation
  const { mutate } = useMutation({
    ...uploadManifestMutation(),
    onSuccess: (response) => {
      // Invalidate the getLatestManifest query to refresh the data
      queryClient.invalidateQueries({
        queryKey: getLatestManifestQueryKey({
          query: {
            s3_path: `${state.selectedVendor.value}/${projectId}/`
          }
        })
      });
      dispatch({ type: 'SET_UPLOADED_FILE', value: response.path });
      toast.success('Manifest uploaded successfully');
    },
    onError: (error) => {
      toast.error(`Error uploading manifest: ${error.message || 'Unknown error'}`);
      console.error(error);
    }
  });

  // Handle file upload
  const onDrop = useCallback((acceptedFiles: Array<File>) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const s3Path = `${state.selectedVendor.value}/${projectId}/${file.name}`;
      
      mutate({
        query: {
          s3_path: s3Path
        },
        body: {
          file: file
        }
      });
      
      
    }
  }, [state.selectedVendor.value, projectId, mutate]);

  // Handle cancel - reset form state
  const handleCancel = () => {
    dispatch({ type: 'SET_VENDOR', value: '', label: '' });
    dispatch({ type: 'SET_UPLOADED_FILE', value: '' });
    dispatch({ type: 'SET_MANIFEST_OPTION', value: 'existing' });
  };

  // Handle sheet open/close - clear state when closing
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleCancel();
    }
  };

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
    <Sheet onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Validate Manifest</SheetTitle>
          <SheetDescription>
            Select and validate vendor manifest files
          </SheetDescription>
          <div className='flex flex-col gap-12 mt-6'>
            <Stepper
              activeStep={state.activeStep}
              showFutureSteps={true}
              steps={[
                {
                  label: "Select Source",
                  description: "Select source bucket where files described in the manifest are located",
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
                  description: "Choose or upload a manifest file to validate",
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
                              {state.isLoadingManifest ? (
                                <Input
                                  readOnly
                                  disabled
                                  value="Loading latest manifest..."
                                  placeholder="Fetching manifest..."
                                />
                              ) : (
                                <Input
                                  readOnly
                                  value={state.latestManifestPath || `${state.selectedVendor.value}/path/to/manifest.csv`}
                                />
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {state.uploadedFile ? (
                                <Input
                                  readOnly
                                  value={state.uploadedFile}
                                />
                              ) : (
                                <FileUpload
                                  onDrop={onDrop}
                                  displayComponent={(
                                    <div className="flex flex-col items-center justify-center">
                                      <div className="font-semibold">Drag or click to upload file</div>
                                      <div className="text-sm text-muted-foreground mt-1">
                                        {`to ${state.selectedVendor.label} bucket`}
                                      </div>
                                    </div>
                                  )}
                                />
                              )}
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
              disabled={
                state.isLoadingManifest || 
                (state.manifestOption === 'existing' && state.manifestError) ||
                (state.manifestOption === 'upload' && !state.uploadedFile)
              }
              onClick={() => {
                const fileName = state.manifestOption === 'existing' 
                  ? state.latestManifestPath
                  : state.uploadedFile;
                toast.success(`Successfully validated "${fileName}" for project ${projectId}`);
              }}
              className='w-full md:w-auto'
            >
              <Check /> Validate
            </Button>
          )}
          
          <SheetClose asChild>
            <Button
              variant="secondary"
              className='w-full md:w-auto'
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

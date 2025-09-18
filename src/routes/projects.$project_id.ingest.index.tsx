import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Briefcase, Building, Check, ClipboardCheck, File, FileInput, Folder, MousePointer2 } from 'lucide-react'
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

  // Capture source state
  const [sourceIsData, setSourceIsData] = useState<boolean | undefined>(undefined);

  // Load vendor options
  const [vendorOptions, setVendorOptions] = useState<Array<ComboBoxOption>>();
  useEffect(() => {
    const fetchVendors = async () => {
      const res = await fetch('/data/example_vendors.json')
      if (!res.ok) {
        throw new Error('Unable to fetch vendor data')
      }
      const options = await res.json()
      setVendorOptions(options)
    }
    fetchVendors()
  }, [])

  // Selected vendor
  const [selectedVendor, setSelectedVendor] = useState<{ value: string, label?: string }>({
    value: '',
    label: ''
  });

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

  // Selected manifest file
  const [selectedFile, setSelectedFile] = useState<string>('');

  // Validated file
  const [validManifest, setValidManifest] = useState<boolean>(false);

  // Stepper progress
  const [activeStep, setActiveStep] = useState<number>(0)


  return (
    <>
      <div className='flex flex-col gap-12 max-w-[40rem] mb-15'>

        {/* Stepper component */}
        <Stepper
          activeStep={activeStep}
          onStepChange={setActiveStep}
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
                          'row-span-1',
                          sourceIsData ? 'border-primary bg-primary/5' : ''
                        )}
                        onClick={() => { 
                          setSourceIsData(true)
                          setSelectedFile('')
                          setValidManifest(false)
                          setActiveStep(1)
                        }}
                      >
                        <CardHeader>
                          <CardTitle
                            className={clsx(
                              'flex items-center gap-2',
                              sourceIsData ? 'text-primary' : ''
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
                              checked={sourceIsData === true}
                              onChange={e => setSourceIsData(e.target.checked)}
                              className='accent-primary'
                            >
                            </Input>
                          </CardAction>
                        </CardHeader>
                      </Card>
                      <Card
                        className={clsx(
                          'row-span-1',
                          sourceIsData === false ? 'border-primary bg-primary/5' : ''
                        )}
                        onClick={() => { 
                          setSourceIsData(false)
                          setSelectedVendor({ value: '', label: '' })
                          setSelectedFile('')
                          setValidManifest(false)
                          setActiveStep(0)
                        }}
                      >
                        <CardHeader>
                          <CardTitle
                            className={clsx(
                              'flex items-center gap-2',
                              sourceIsData === false ? 'text-primary' : ''
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
                              checked={sourceIsData === false}
                              onChange={e => setSourceIsData(e.target.checked)}
                              className='accent-primary'
                            >
                            </Input>
                          </CardAction>
                        </CardHeader>
                      </Card>
                    </div>

                    {/* Vendor Bucket Selected */}
                    {sourceIsData === false && (
                      <div className="flex flex-col gap-2">
                        <Label>Which vendor bucket?</Label>
                        <div className='flex gap-2'>
                          <div className='flex flex-col flex-1'>
                            <ComboBox
                              id="vendorBucket"
                              options={vendorOptions ?? []}
                              placeholder="Select vendor bucket"
                              value={selectedVendor.value}
                              onChange={(value: string, label?: string) => { 
                                setSelectedVendor({ value, label })
                                if (value) setActiveStep(1)
                              }}
                            />
                          </div>

                          <Tooltip>
                            <FileBrowserDialog
                              trigger={(
                                <TooltipTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    disabled={selectedVendor.value === ''}
                                  >
                                    <Folder /> Browse
                                  </Button>
                                </TooltipTrigger>
                              )}
                              data={vendorBucketData}
                              rootPath={`/`} // selectedVendor will go here
                            >
                            </FileBrowserDialog>
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
                  {(selectedVendor.value !== '' || sourceIsData === true) && (
                    <div className='flex flex-col gap-4'>
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-2">

                        {/* Left box */}
                        <div className="flex flex-col gap-2 md:flex-1">
                          <FileBrowserDialog
                            trigger={(
                              <div
                                className="relative flex items-center justify-center text-center w-full h-48 border-2 rounded-lg cursor-pointer hover:bg-primary/5 hover:border-primary"
                                onClick={() => { 
                                  setSelectedFile('/path/to/selected_manfiest_file.csv')
                                  setActiveStep(2)
                                }}
                              >
                                <MousePointer2 className="absolute inset-0 z-[-1] text-accent w-full h-full" />
                                <div className="text-center">
                                  <div className="font-semibold">Click to select file</div>
                                  <div className="text-sm text-muted-foreground">
                                    {sourceIsData ? 'from internal data bucket' : `from ${selectedVendor.label} bucket`}
                                  </div>
                                </div>

                              </div>
                            )}
                            data={vendorBucketData}
                            rootPath={`/`}
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
                                  {sourceIsData 
                                    ? 'upload to internal data bucket' 
                                    : `to ${selectedVendor.label} bucket`}
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
                  {selectedFile !== '' && (
                    <div className='flex flex-col gap-4'>
                      <div className='border-1 rounded-lg border-primary/25 p-2'>
                        <div className='flex items-center justify-between gap-8'>
                          <div className='flex items-center gap-2 text-primary whitespace-normal text-wrap break-all'>
                            <File className='size-4' />
                            {selectedFile}
                          </div>
                          <Button
                            variant='link'
                            className='text-destructive'
                            onClick={() => { 
                              setSelectedFile('')
                              setValidManifest(false)
                              setActiveStep(1)
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
                            setValidManifest(true)
                            setActiveStep(3)
                          }}
                        >
                          {validManifest
                            ? (
                              <><Check /> Valid</>
                            ) : (
                              <><ClipboardCheck /> Validate</>
                            )}
                        </Button>
                        <Button
                          disabled={!validManifest}
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

import { FileInput, Folder } from 'lucide-react'
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import type React from 'react'
import type { JSX } from 'react'
import type { VendorPublic } from '@/client/types.gen'
import type { ComboBoxOption } from '@/components/combobox'
import { getVendors } from '@/client'
import { ComboBox } from '@/components/combobox'
import { FileBrowserDialog } from '@/components/file-browser'
import { Button } from '@/components/ui/button'
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
  // State for selected vendor
  const [selectedVendor, setSelectedVendor] = useState<{ value: string; label?: string }>({ value: '', label: '' });

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

  // Handle vendor selection
  const handleVendorChange = (value: string, label?: string) => {
    setSelectedVendor({ value, label });
  };

  // Handle ingest button click
  const handleIngest = () => {
    toast.success(`Successfully ingested data from ${selectedVendor.label} into project ${projectId}`);
  };

  // Handle cancel - reset form state
  const handleCancel = () => {
    setSelectedVendor({ value: '', label: '' });
  };

  // Handle sheet open/close - clear state when closing
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleCancel();
    }
  };

  return (
    <Sheet onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Ingest Vendor Data</SheetTitle>
          <SheetDescription>
            Select a vendor source bucket to ingest data
          </SheetDescription>
          
          <div className='flex flex-col gap-6 pt-6'>
            <div className="flex flex-col gap-2">
              <div className='flex flex-col gap-2 md:flex-row md:gap-2'>
                <div className='flex flex-col flex-1'>
                  <ComboBox
                    id="vendorBucket"
                    options={vendorOptions}
                    placeholder={isLoadingVendors ? "Loading vendors..." : "Select source bucket"}
                    value={selectedVendor.value}
                    onChange={handleVendorChange}
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
                          disabled={selectedVendor.value === ''}
                          className='w-full md:w-auto'
                        >
                          <Folder /> Browse
                        </Button>
                      </TooltipTrigger>
                    )}
                    rootPath={`${selectedVendor.value}/${projectId}/`}
                  />
                  <TooltipContent>
                    Browse {selectedVendor.value}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </SheetHeader>

        <SheetFooter>
          {selectedVendor.value && (
            <Button
              onClick={handleIngest}
              className='w-full md:w-auto'
            >
              <FileInput /> Ingest
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

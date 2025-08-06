import { ClipboardCheck, FolderOpen, HardDriveDownload } from "lucide-react";
import type React from "react";
import type { JSX } from "react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ComboBox } from "@/components/combobox";


interface IngestVendorFormProps {
  /** Trigger for the Sheet component */
  trigger: JSX.Element
}

export const IngestVendorForm: React.FC<IngestVendorFormProps> = ({
  trigger
}) => {
  return (
    <>
      <Sheet>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <div className="mb-4">
              <SheetTitle>Ingest Vendor Data</SheetTitle>
              <SheetDescription>
                Select the vendor below to ingest data into NGS360.
              </SheetDescription>
            </div>
            <form>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <Label>Vendor Bucket</Label>
                  <ComboBox
                    id={""}
                    options={
                      [
                        {
                          label: "Admera Health",
                          value: "bms-ngs-75618",
                          description: "Description about Admera Health"
                        },
                        {
                          label: "ArcherDx",
                          value: "bms-ngs-71854",
                          description: "Description about ArcherDx"
                        }
                      ]
                    }
                    placeholder="Select vendor bucket"
                    value={""}
                    onChange={(value: string) => (console.log(value))}
                  />
                  <Button
                    type="button"
                    variant='outline'
                  >
                    <FolderOpen /> Browse Bucket
                  </Button>
                </div>
                <Button
                  type="button"
                  variant='outline'
                >
                  <ClipboardCheck /> Validate Manifest
                </Button>
              </div>
            </form>
          </SheetHeader>
          <SheetFooter>
            <Button
              type='submit'
            >
              <HardDriveDownload /> Ingest data
            </Button>
            <SheetClose asChild>
              <Button
                variant='secondary'
              >
                Close
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
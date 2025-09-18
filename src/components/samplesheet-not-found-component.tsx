import { FileUpload } from "@/components/file-upload"



// Define error component for samplesheet path
export const NotFoundComponent = () => {
  return (
    <>
      <FileUpload
        displayComponent={(
          <span className="text-primary hover:underline mx-2">
            Drag and drop your samplesheet here, or click to select
          </span>
        )}
      />
    </>
  )
}
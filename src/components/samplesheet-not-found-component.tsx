import { FileUpload } from "@/components/file-upload"



// Define error component for samplesheet path
export const NotFoundComponent = () => {
  return (
    <>
      <FileUpload
        subject="samplesheet"
      />
    </>
  )
}
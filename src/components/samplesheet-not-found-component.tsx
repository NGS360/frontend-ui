import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { toast } from "sonner";
import { FileUpload } from "@/components/file-upload"
import { createFileMutation } from "@/client/@tanstack/react-query.gen";

// Define error component for samplesheet path
export const NotFoundComponent = () => {

  // Get route params
  const routeApi = getRouteApi('/runs/$run_barcode/samplesheet/')
  const { run_barcode } = routeApi.useParams()

  // File upload mutation
  const { mutate } = useMutation({
    ...createFileMutation(),
    onSuccess: (data) => {
      console.log(data);
      toast.success(`${data.filename} for run ${run_barcode} uploaded successfully`);
    },
    onError: (error) => {
      console.error(error);
    }
  })

  // File upload handler
  const onDrop = useCallback((
    acceptedFiles: Array<File>
  ) => {
    if (acceptedFiles.length > 0) {
      mutate({ body: {
        filename: acceptedFiles[0].name,
        content: acceptedFiles[0],
        entity_type: "run",
        entity_id: run_barcode,
        file_type: "samplesheet",
        created_by: "current_user",
        description: "Uploaded via UI",
        is_public: false
      }});
    } else {
      console.error("No files accepted");
    }
  }, [])

  return (
    <FileUpload
      onDrop={onDrop}
      displayComponent={(
        <span className="text-primary hover:underline mx-2">
          Drag and drop your samplesheet here, or click to select
        </span>
      )}
    />
  )
}
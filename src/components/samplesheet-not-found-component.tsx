import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { toast } from "sonner";
import { FullscreenSpinner } from "@/components/spinner";
import { FileUpload } from "@/components/file-upload"
import { getRunSamplesheetQueryKey, postRunSamplesheetMutation } from "@/client/@tanstack/react-query.gen";

// Define error component for samplesheet path
export const NotFoundComponent = () => {

  // Get route params
  const routeApi = getRouteApi('/_authenticated/runs/$run_barcode/samplesheet/')
  const { run_barcode } = routeApi.useParams()

  const queryClient = useQueryClient();

  // File upload mutation
  const { mutate, isPending } = useMutation({
    ...postRunSamplesheetMutation(),
    onSuccess: () => {
      // Invalidate the query for the run to refresh samplesheet info
      queryClient.invalidateQueries({
        queryKey: getRunSamplesheetQueryKey({
          path: {
            run_barcode: run_barcode
          }
        })
      });
      toast.success(`Samplesheet for run ${run_barcode} uploaded successfully`);
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
      mutate({ 
        path: {
          run_barcode: run_barcode
        },
        body: {
          file: acceptedFiles[0],
        }
      });
    } else {
      console.error("No files accepted");
    }
  }, [])

  // Show loading spinner
  if (isPending) {
    return <FullscreenSpinner variant='ellipsis' />
  }

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
import { CloudUpload } from "lucide-react";
import { useCallback } from "react";
import { useDropzone } from 'react-dropzone';
import type { DropEvent, FileRejection } from "react-dropzone";

interface FileUploadProps {
  /** The subject text that is displayed in drag and drop text.*/
  subject: string,
}

export const FileUpload: React.FC<FileUploadProps> = ({
  subject = "file"
}) => {

  const onDrop = useCallback((
    acceptedFiles: Array<File>,
    fileRejections: Array<FileRejection>,
    event: DropEvent
  ) => {
    console.log(acceptedFiles);
    console.log(fileRejections);
    console.log(event)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.csv', '.tsv', '.txt'],
      'application/vnd.ms-excel': ['.csv', '.tsv', '.txt']
    },
    multiple: false
  });

  return (
    <>
      <div
        {...getRootProps()}
        className={`relative flex items-center justify-center text-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer 
          ${isDragActive && "bg-primary/2"}`}
      >
        <CloudUpload
          className="absolute inset-0 z-[-1] text-accent w-full h-full"
        />
        <input {...getInputProps()} />
        <span className="text-primary hover:underline mx-2">
          {isDragActive
            ? "Drop to upload"
            : `Drag and drop your ${subject} here, or click to select`}
        </span>
      </div>
    </>
  )
}
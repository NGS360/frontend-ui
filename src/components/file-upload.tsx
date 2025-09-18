import clsx from "clsx";
import { CloudUpload } from "lucide-react";
import { useCallback } from "react";
import { useDropzone } from 'react-dropzone';
import type { DropEvent, FileRejection } from "react-dropzone";

// Generic file upload component
interface FileUploadProps {
  /** Text to display in the box */
  displayComponent?: React.ReactElement,

  /** Text to display when the drag is active */
  dragActiveComponent?: React.ReactElement
}

export const FileUpload: React.FC<FileUploadProps> = ({
  displayComponent = (
    <span className="text-primary hover:underline mx-2">
      Drag and drop your file here, or click to select
    </span>
  ),
  dragActiveComponent = (
    <span className="text-primary hover:underline mx-2">
      Drop to upload
    </span>
  )
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
        className={`relative flex items-center justify-center text-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-primary/5 hover:border-primary 
          ${isDragActive && "bg-primary/5"}`}
      >
        <CloudUpload
          className="absolute inset-0 z-[-1] text-accent w-full h-full"
        />
        <input {...getInputProps()} />
        {isDragActive
          ? dragActiveComponent
          : displayComponent}
      </div>
    </>
  )
}

// Full screen dropzone component
interface FullscreenDropzoneProps {
  subject?: string,
  children: React.ReactNode
}

export const FullscreenDropzone: React.FC<FullscreenDropzoneProps> = ({
  subject = "a new samplesheet",
  children
}) => {

  // Prepare dropzone for file upload
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
    multiple: false,
    noClick: true
  })


  return (
    <>
      <div
        {...getRootProps()}
        className='relative'
      >
        <input {...getInputProps()} />

        {/* Page contents */}
        {children}
        
      </div>

      {/* Full-screen overlay */}
      <div
        className={clsx(
          'fixed inset-0 z-10 flex flex-col gap-2 items-center justify-center border-primary border-4 bg-background/75 transition-opacity duration-200 pointer-events-none',
          isDragActive ? 'opacity-100' : 'opacity-0'
        )}
      >
        <CloudUpload className="text-primary size-18" />
        <span className="ml-2 text-primary font-bold">Drop file here to upload {subject}</span>
      </div>
    </>
  )
}
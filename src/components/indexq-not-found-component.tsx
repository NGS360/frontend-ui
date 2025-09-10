import { PlayCircle } from "lucide-react"
import { Button } from "./ui/button"

// Define error component for indexqc path
export const NotFoundComponent = () => {
  return (
    <>
      <div className="flex flex-col gap-4 items-center justify-center mt-25">
        <h1 className="text-2xl font-light">
          No IndexQC Data Available
        </h1>
        <div className="flex flex-col text-muted-foreground">
          <p className="text-center">
            This run has not been demultiplexed.
          </p>
          <p className="text-center">
            Add a samplesheet before
            clicking the button below to demultiplex this run:
          </p>
        </div>
        <Button
         variant='primary2'
        > 
          <PlayCircle /> Demultiplex Run
        </Button>
      </div>
    </>
  )
}
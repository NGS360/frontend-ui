import { DatabaseZap } from "lucide-react"

// Define error component for indexqc path
export const NotFoundComponent = () => {
  return (
    <>
      <div className="flex flex-col gap-4 items-center justify-center mt-25">
        <div className="relative">
          <DatabaseZap className="size-32 text-muted-foreground opacity-20" strokeWidth={1} />
        </div>
        <h1 className="text-2xl font-light text-muted-foreground">
          No IndexQC Data Available
        </h1>
      </div>
    </>
  )
}
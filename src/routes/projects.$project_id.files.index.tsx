import { createFileRoute, getRouteApi, notFound } from '@tanstack/react-router'
import { FolderCheck, FolderSearch } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileBrowser } from '@/components/file-browser'

export const Route = createFileRoute('/projects/$project_id/files/')({
  component: RouteComponent,
  loader: async () => {
    // Get example data
    const dataRes = await fetch('/data/example_project_data.json')
    // const res = new Response(null, {status: 404, statusText: "Not found"})
    if (!dataRes.ok) {
      if (dataRes.status === 404) {
        throw notFound()
      }
      if (dataRes.status !== 200) {
        throw new Error("An error occurred: " + dataRes.statusText || "An unknown error occurred.")
      }
    }

    // Get example results
    const resultsRes = await fetch('/data/example_project_results.json')
    // const res = new Response(null, {status: 404, statusText: "Not found"})
    if (!resultsRes.ok) {
      if (resultsRes.status === 404) {
        throw notFound()
      }
      if (resultsRes.status !== 200) {
        throw new Error("An error occurred: " + resultsRes.statusText || "An unknown error occurred.")
      }
    }

    const data = await dataRes.json()
    const results = await resultsRes.json()

    return ({
      data: data,
      results: results
    })
  }
})

function RouteComponent() {
  // Load project data
  const routeApi = getRouteApi('/projects/$project_id/files/')
  const { data, results } = routeApi.useLoaderData()

  return (
    <>
      <div className="flex flex-col gap-4 mt-4">
        <h1 className="font-light">
          View data associated with this NGS360 project
        </h1>
        <Tabs defaultValue="data" className="w-full">
          <TabsList>
            <TabsTrigger value="data">
              <FolderSearch /> Data Bucket
            </TabsTrigger>
            <TabsTrigger value="results">
              <FolderCheck /> Results Bucket
            </TabsTrigger>
          </TabsList>
          <TabsContent value="data">
            <FileBrowser
              data={data}
              rootPath='/'
            />
          </TabsContent>
          <TabsContent value="results">
            <FileBrowser
              data={results}
              rootPath='/'
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

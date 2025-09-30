import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { FolderCheck, FolderSearch } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileBrowser } from '@/components/file-browser'

export const Route = createFileRoute('/projects/$project_id/files/')({
  component: RouteComponent,
})

function RouteComponent() {
  // Load project data
  const routeApi = getRouteApi('/projects/$project_id')
  const { project } = routeApi.useLoaderData()

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
              showHeader={true}
              rootPath='/app/storage/project/PROJ001/'
            />
          </TabsContent>
          <TabsContent value="results">
            <FileBrowser
              showHeader={true}
              rootPath='/app/storage/project/PROJ001/'
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

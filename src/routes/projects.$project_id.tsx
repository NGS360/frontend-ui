import { createFileRoute, redirect } from '@tanstack/react-router'
import { AxiosError } from 'axios'
import { FolderOpen, FolderSearch, HardDriveDownload, Pencil, PillBottle, Plus, Tag, Zap } from 'lucide-react'
import { useState } from "react"
import type { ColumnDef, PaginationState } from "@tanstack/react-table"
import { getProjectByProjectId } from '@/client'
import { CopyableText } from '@/components/copyable-text'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { DataTable } from '@/components/data-table/data-table'
import { FileUpload } from '@/components/file-upload'
import { IngestVendorForm } from '@/components/ingest-vendor-form'
import { isValidHttpURL } from '@/lib/utils'

export const Route = createFileRoute('/projects/$project_id')({
  component: RouteComponent,
  loader: async ({ params }) => {
    const projectData = await getProjectByProjectId({
      path: {
        project_id: params.project_id
      }
    })
    if (projectData.status !== 200 || projectData instanceof AxiosError) {
      alert("An error occurred: " + projectData.error?.detail || "An unknown error occurred.")
      throw redirect({ to: '/projects' })
    }
    return ({
      crumb: projectData.data.project_id,
      includeCrumbLink: true,
      project: projectData.data
    })
  }
})

// Define empty row (for now)
interface EmptyRow { }

function RouteComponent() {
  // Load project data
  const { project } = Route.useLoaderData();

  // Use mobile hook
  const isMobile = useIsMobile();

  // Query samples (TODO)
  const [data] = useState(false);


  // Table (empty for now)
  const emptyData: Array<EmptyRow> = []
  const emptyColumns: Array<ColumnDef<EmptyRow, any>> = []
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  return (
    <>
      <div className='flex flex-col gap-4'>

        {/* Header and action bar */}
        <h1 className='text-3xl font-extralight'>{project.name}</h1>
        <div className='flex gap-2 flex-col md:flex-row md:h-9 md:items-center'>
          <CopyableText
            text={project.project_id}
            variant='default'
            className='font-semibold [&>span]:truncate'
          />
          {!isMobile && <Separator orientation='vertical' className='mr-2' />}
          <Button
            variant='outline'
            size='default'
            className='w-full md:w-auto'
          >
            <FolderOpen /> <span>Source Data</span>
          </Button>
          <Button
            variant='outline'
            size='default'
            className='w-full md:w-auto'
          >
            <FolderSearch /> <span>View Results</span>
          </Button>
          <IngestVendorForm
            trigger={(
              <Button
                variant='outline'
                size='default'
                className='w-full md:w-auto'
              >
                <HardDriveDownload /> <span>Ingest Vendor Data</span>
              </Button>
            )}
          />
          <Button
            variant='outline'
            size='default'
            className='w-full md:w-auto'
          >
            <Zap /> <span>Project Actions</span>
          </Button>
        </div>

        {/* Attributes */}
        <Accordion
          type='single'
          collapsible
          className='w-full'
          defaultValue='attribute-grid'
        >
          <AccordionItem value='attribute-grid'>
            <AccordionTrigger className='uppercase font-light text-primary'>
              <span className='flex gap-2  items-center'>
                <Tag size={14} /> Project attributes
              </span>
            </AccordionTrigger>
            <AccordionContent
              className='flex flex-col gap-4'
            >
              <div className='grid grid-flow-row gap-2 md:grid-cols-3 lg:grid-cols-6'>
                {project.attributes?.map((d) => (
                  <Card
                    key={d.key}
                    className='border-0 shadow-none py-2 px-0 bg-transparent'
                  >
                    <CardContent className='px-0'>
                      <CardTitle className='uppercase text-sm font-light text-muted-foreground'>
                        {d.key}
                      </CardTitle>
                      <CardDescription className='font-semibold '>
                        <CopyableText
                          text={d.value || ""}
                          variant={isValidHttpURL(d.value) ? 'hoverLink' : 'hover'}
                          size='sm'
                          className='[&>span]:truncate'
                        />
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button variant='outline' className='w-full md:w-fit'>
                {!project.attributes || project.attributes.length === 0 ? (
                  <>
                    <Plus />
                    <span>Add attributes</span>
                  </>
                ) : (
                  <>
                    <Pencil />
                    <span>Edit attributes</span>
                  </>
                )}
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Samples table */}
        <Accordion
          type='single'
          collapsible
          className='w-full'
          defaultValue='samples-table'
        >
          <AccordionItem value='samples-table'>
            <AccordionTrigger className='uppercase font-light text-primary'>
              <span className='flex gap-2 items-center'>
                <PillBottle size={14} /> Sample table
              </span>
            </AccordionTrigger>
            <AccordionContent className='pt-2'>
              {data ? (
                <DataTable<EmptyRow, any>
                  data={emptyData}
                  columns={emptyColumns}
                  pagination={pagination}
                  onPaginationChange={setPagination}
                  pageCount={0}
                  totalItems={0}
                />
              ) : (
                <FileUpload subject='samplesheet.tsv' />
              )}

            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </>
  )
}

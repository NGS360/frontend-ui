import { Outlet, createFileRoute } from '@tanstack/react-router'

export const RouteComponent = () => (
  <>
    <Outlet />
  </>
)

// Define run samplesheet type (these will come later from the API)
export interface RunSamplesheet {
  Summary: {
    id: number,
    run_date: string,
    machine_id: string,
    run_number: string,
    run_time: string,
    flowcell_id: string,
    experiment_name:string,
    s3_run_folder_path: string,
    status: string,
    barcode: string
  },
  Header: {
    IEMFileVersion: string,
    InvestigatorName: string,
    ExperimentName: string,
    Date: string,
    Workflow: string,
    Application: string,
    InstrumentType: string,
    Assay: string,
    IndexAdapters: string,
    Chemistry: string
  },
  Reads: Array<number>,
  Settings: {},
  DataCols: Array<string>,
  Data: Array<Record<string, string>>
}

export const Route = createFileRoute('/runs/$run_barcode/samplesheet')({
  component: RouteComponent,
  loader: async () => { // loader: async ({ params }) => {

    // Get run samplesheet data
    const res = await fetch('/data/example_run_samplesheet_data.json')
    if (!res.ok) throw new Error('Unable to fetch run samplesheet data')
    const runSamplesheet: RunSamplesheet = await res.json()

    return ({
      crumb: 'Samplesheet',
      includeCrumbLink: true,
      runInfo: runSamplesheet
    })
  },
})

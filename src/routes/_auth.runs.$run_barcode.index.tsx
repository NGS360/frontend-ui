import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute('/_auth/runs/$run_barcode/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/runs/$run_barcode/samplesheet',
      params: params
    })
  }
})
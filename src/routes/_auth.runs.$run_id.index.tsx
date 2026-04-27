import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute('/_auth/runs/$run_id/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/runs/$run_id/samplesheet',
      params: params
    })
  }
})
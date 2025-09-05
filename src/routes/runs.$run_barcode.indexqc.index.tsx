import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/runs/$run_barcode/indexqc/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/runs/$run_barcode/indexqc/"!</div>
}

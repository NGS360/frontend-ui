import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_home/admin/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className='flex flex-col gap-2'>
        <h1 className="text-3xl">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the admin panel. Add admin-only content for viewing NGS360 data here.
        </p>
      </div>


    </div>
  )
}

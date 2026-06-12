import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_user')({
  component: RouteComponent,
})

function RouteComponent() {
  // Container for @-variant queries; these pages have no sidebar, so the
  // container tracks the viewport, but a container ancestor must exist for
  // the variants to apply at all.
  return (
    <div className="@container">
      <Outlet />
    </div>
  )
}

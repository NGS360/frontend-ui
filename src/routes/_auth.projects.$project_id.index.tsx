import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute('/_auth/projects/$project_id/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/projects/$project_id/samples',
      params: params
    })
  }
})

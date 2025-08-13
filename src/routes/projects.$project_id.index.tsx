import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute('/projects/$project_id/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/projects/$project_id/overview',
      params: params
    })
  }
})
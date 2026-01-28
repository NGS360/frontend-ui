import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_home/jobs/')({
  beforeLoad: () => {
    throw redirect({ to: '/profile' , hash: '#jobs'})
  },
})

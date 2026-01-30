import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/jobs/')({
  beforeLoad: () => {
    throw redirect({ to: '/profile' , hash: '#jobs'})
  },
})

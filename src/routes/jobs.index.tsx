import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/jobs/')({
  beforeLoad: () => {
    throw redirect({ to: '/profile' , hash: '#jobs'})
  },
})

import { Users } from '@/apps/users'
import { createFileRoute } from '@tanstack/react-router'


export const Route = createFileRoute('/_authenticated/users/')({

  component: Users,
})

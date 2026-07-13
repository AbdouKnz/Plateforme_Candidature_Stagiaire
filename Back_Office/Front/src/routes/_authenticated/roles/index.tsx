import { Roles } from '@/apps/roles'
import { createFileRoute } from '@tanstack/react-router'


export const Route = createFileRoute('/_authenticated/roles/')({
  component: Roles,
})

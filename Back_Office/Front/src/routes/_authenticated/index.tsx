import { createFileRoute } from '@tanstack/react-router'
import { Dashboard } from '@/apps/dashboard'

export const Route = createFileRoute('/_authenticated/')({
  component: Dashboard,
})

import { createFileRoute } from '@tanstack/react-router'
import { Settings } from '@/apps/settings'

export const Route = createFileRoute('/_authenticated/settings')({
  component: Settings,
})

import { Technologies } from '@/apps/technologies'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/settings/technologies')({
  component: Technologies,
})

import { Types } from '@/apps/types'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/settings/types')({
  component: Types,
})

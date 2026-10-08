import { Degrees } from '@/apps/degrees'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/degrees/')({
  component: Degrees,
})

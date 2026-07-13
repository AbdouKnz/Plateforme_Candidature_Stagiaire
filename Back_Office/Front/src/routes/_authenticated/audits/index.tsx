import { Audits } from '@/apps/audits'
import { createFileRoute } from '@tanstack/react-router'


export const Route = createFileRoute('/_authenticated/audits/')({
  component: Audits,
})

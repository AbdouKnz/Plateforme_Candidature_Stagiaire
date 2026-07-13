import { createFileRoute } from '@tanstack/react-router'
import { EmailLogs } from '@/apps/email-logs'

export const Route = createFileRoute('/_authenticated/email-logs/')({
  component: EmailLogs,
})

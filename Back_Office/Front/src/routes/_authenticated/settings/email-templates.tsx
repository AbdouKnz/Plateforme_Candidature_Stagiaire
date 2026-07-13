import { EmailTemplates } from '@/apps/email-templates'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/settings/email-templates')({
  component: EmailTemplates,
})
import { SettingsEmailFooter } from '@/apps/settings/email-footer'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/settings/email-footer')({
  component: SettingsEmailFooter,
})

import { SettingsSession } from '@/apps/settings/session'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/settings/session')({
  component: SettingsSession,
})

import { SettingsMailConfig } from '@/apps/settings/mail-config'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/settings/mail-config')({
  component: SettingsMailConfig,
})
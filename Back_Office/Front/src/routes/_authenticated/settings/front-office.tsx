import { SettingsFrontOffice } from '@/apps/settings/front-office'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/settings/front-office')({
  component: SettingsFrontOffice,
})
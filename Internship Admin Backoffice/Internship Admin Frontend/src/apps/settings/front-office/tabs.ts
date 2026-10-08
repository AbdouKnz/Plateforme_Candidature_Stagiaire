import { Power, Save, PanelBottom, type LucideIcon } from 'lucide-react'

export type FrontOfficeTabId = 'status' | 'info' | 'footer'

export const frontOfficeTabs: { id: FrontOfficeTabId; title: string; icon: LucideIcon; color: string }[] = [
  {
    id: 'status',
    title: 'front_office_status',
    icon: Power,
    color: 'text-orange-500',
  },
  {
    id: 'info',
    title: 'internship_title',
    icon: Save,
    color: 'text-sky-500',
  },
  {
    id: 'footer',
    title: 'footer',
    icon: PanelBottom,
    color: 'text-violet-500',
  },
]

export function parseFrontOfficeTab(value: unknown): FrontOfficeTabId {
  return value === 'info' || value === 'footer' ? value : 'status'
}

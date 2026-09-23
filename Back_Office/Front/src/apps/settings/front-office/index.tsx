import { useLocation } from "@tanstack/react-router"
import { Main } from "@/components/layout/main"
import { FrontOfficeStatusCard } from './front-office-status-card'
import { FrontOfficeInfoCard } from './front-office-info-card'
import { FrontOfficeFooterCard } from './front-office-footer-card'
import { parseFrontOfficeTab } from './tabs'

export function SettingsFrontOffice() {
  const search = useLocation({ select: (location) => location.search })
  const activeTab = parseFrontOfficeTab(
    (search as Record<string, unknown> | undefined)?.tab
  )

  return (
    <Main>
      {activeTab === 'status' ? <FrontOfficeStatusCard /> : activeTab === 'info' ? <FrontOfficeInfoCard /> : <FrontOfficeFooterCard />}
    </Main>
  )
}

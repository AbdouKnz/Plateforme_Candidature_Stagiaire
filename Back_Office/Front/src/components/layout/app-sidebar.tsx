import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'
import { useFilteredSidebarData } from '@/lib/utils'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const filteredSidebarData = useFilteredSidebarData(sidebarData)

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher teams={filteredSidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        {filteredSidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={filteredSidebarData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
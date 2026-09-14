import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { TeamSwitcher } from './team-switcher'
import { useFilteredSidebarData } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { IconRotateClockwise } from '@tabler/icons-react'
import { SessionResetModal } from '@/components/shared/session-reset-modal'

export function AppSidebar() {
  const { t } = useTranslation()
  const { collapsible, variant } = useLayout()
  const { state } = useSidebar()
  const filteredSidebarData = useFilteredSidebarData(sidebarData)

  const user = useAuthStore((s) => s.user)
  const isSuperAdmin = user?.role_name === 'Super Admin'

  const [resetModalOpen, setResetModalOpen] = useState(false)
  const isCollapsed = state === 'collapsed'

  return (
    <>
      <Sidebar collapsible={collapsible} variant={variant}>
        <SidebarHeader>
          <TeamSwitcher teams={filteredSidebarData.teams} />
        </SidebarHeader>
        <SidebarContent>
          {filteredSidebarData.navGroups.map((props) => (
            <NavGroup key={props.title} {...props} />
          ))}
        </SidebarContent>

        {isSuperAdmin && (
          <SidebarFooter className="border-t border-sidebar-border/40 p-2">
            <div
              className={
                isCollapsed
                  ? 'flex items-center justify-center'
                  : 'flex items-center justify-end'
              }
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size={isCollapsed ? 'icon' : 'sm'}
                    onClick={() => setResetModalOpen(true)}
                    className={
                      isCollapsed
                        ? 'size-8 rounded-md text-destructive/80 hover:bg-destructive/10 hover:text-destructive'
                        : 'group flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-destructive/80 hover:bg-destructive/10 hover:text-destructive'
                    }
                  >
                    <IconRotateClockwise className="size-4 transition-transform duration-300 group-hover:-rotate-90" />
                    {!isCollapsed && <span>{t('reset_session', 'Reset Session')}</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{t('reset_session_tooltip', 'Export and reset recruitment session')}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </SidebarFooter>
        )}

        <SidebarRail />
      </Sidebar>

      {isSuperAdmin && (
        <SessionResetModal
          open={resetModalOpen}
          onOpenChange={setResetModalOpen}
        />
      )}
    </>
  )
}
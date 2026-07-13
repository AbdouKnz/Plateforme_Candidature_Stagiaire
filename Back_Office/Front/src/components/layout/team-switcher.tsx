import {
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Team } from '@/models/sidebar-model'

type TeamSwitcherProps = {
  teams: Team[]
}

export function TeamSwitcher({ teams }: TeamSwitcherProps) {
  const activeTeam = teams[0]

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className='flex items-center gap-3 px-3 py-4'>
          <div className="bg-gradient-to-br from-primary to-primary/70 rounded-xl p-2 shadow-sm">
            <img
              src="/images/astero.ico"
              alt="Asteroidea"
              width={24}
              height={24}
              className="rounded object-contain brightness-0 invert"
            />
          </div>
          <div className='grid flex-1 text-start'>
            <span className='truncate text-sm font-semibold tracking-tight text-sidebar-foreground'>
              {activeTeam.name}
            </span>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

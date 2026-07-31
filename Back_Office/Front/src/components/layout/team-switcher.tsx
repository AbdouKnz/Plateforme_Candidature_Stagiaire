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
          <img
            src="/website.png"
            alt="Asteroidea"
            width={36}
            height={36}
            className="object-contain shrink-0"
          />
          <div className='grid flex-1 text-start'>
            <span className='truncate text-base font-bold tracking-tight text-white'>
              {activeTeam.name}
            </span>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

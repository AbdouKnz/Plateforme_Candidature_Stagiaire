import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  GraduationCap,
  Laptop,
  IdCard,
  Clock,
  Tags,
  Building2,
  Mail,
  MailCheck,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { IconSettings } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

export interface SettingsMenuItem {
  title: string
  href: string
  icon: LucideIcon
  color: string
}

export const settingsMenuItems: SettingsMenuItem[] = [
  {
    title: 'degree_management',
    href: '/settings/degrees',
    icon: GraduationCap,
    color: 'text-indigo-500',
  },
  {
    title: 'duration_management',
    href: '/settings/durations',
    icon: Clock,
    color: 'text-amber-500',
  },
  {
    title: 'profile_management',
    href: '/settings/profiles',
    icon: IdCard,
    color: 'text-sky-500',
  },
  {
    title: 'technology_management',
    href: '/settings/technologies',
    icon: Laptop,
    color: 'text-[#1d7cc7]',
  },
  {
    title: 'type_management',
    href: '/settings/types',
    icon: Tags,
    color: 'text-rose-500',
  },
  {
    title: 'email_template_management',
    href: '/settings/email-templates',
    icon: Mail,
    color: 'text-emerald-500',
  },
  {
    title: 'mail_config_management',
    href: '/settings/mail-config',
    icon: MailCheck,
    color: 'text-cyan-500',
  },
  {
    title: 'front_office_management',
    href: '/settings/front-office',
    icon: Building2,
    color: 'text-orange-500',
  },
]

export function SettingsMenu() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(true)

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Card className="p-0">
      <CardContent className="p-1">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent',
                open && 'bg-accent font-semibold'
              )}
            >
              <span className="text-muted-foreground">
                <IconSettings className="size-4" />
              </span>
              <span className="flex-1 text-left">{t('settings')}</span>
              <ChevronRight
                className={cn(
                  'size-4 text-muted-foreground transition-transform',
                  open && 'rotate-90'
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="CollapsibleContent">
            <div className="flex flex-col gap-0.5 pt-0.5">
              {settingsMenuItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-2 rounded-md py-1.5 pr-2 pl-8 text-sm hover:bg-accent',
                      active
                        ? 'bg-accent font-medium text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <item.icon className={cn('size-4 shrink-0', item.color)} />
                    <span className="truncate">{t(item.title)}</span>
                  </Link>
                )
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

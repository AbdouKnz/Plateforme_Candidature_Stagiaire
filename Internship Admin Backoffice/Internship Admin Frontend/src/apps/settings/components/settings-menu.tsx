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
  RotateCcw,
  ChevronRight,
  Layers,
  Power,
  Save,
  PanelBottom,
  type LucideIcon,
} from 'lucide-react'
import { IconSettings } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

export interface SettingsMenuChild {
  title: string
  href: string
  icon: LucideIcon
  color: string
}

export interface SettingsMenuGroup {
  title: string
  icon: LucideIcon
  children?: SettingsMenuChild[]
  href?: string
  childColor?: string
  superAdminOnly?: boolean
}

export const settingsMenuGroups: SettingsMenuGroup[] = [
  {
    title: 'settings_group_application',
    icon: Layers,
    children: [
      {
        title: 'degree_management',
        href: '/settings/degrees',
        icon: GraduationCap,
        color: 'text-indigo-500',
      },
      {
        title: 'type_management',
        href: '/settings/types',
        icon: Tags,
        color: 'text-rose-500',
      },
      {
        title: 'technology_management',
        href: '/settings/technologies',
        icon: Laptop,
        color: 'text-[#1d7cc7]',
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
    ],
  },
  {
    title: 'settings_group_emails',
    icon: Mail,
    children: [
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
        title: 'footer',
        href: '/settings/email-footer',
        icon: PanelBottom,
        color: 'text-violet-500',
      },
    ],
  },
  {
    title: 'settings_group_front_office',
    icon: Building2,
    children: [
      {
        title: 'front_office_status',
        href: '/settings/front-office',
        icon: Power,
        color: 'text-orange-500',
      },
      {
        title: 'internship_title',
        href: '/settings/front-office',
        icon: Save,
        color: 'text-sky-500',
      },
      {
        title: 'footer',
        href: '/settings/front-office',
        icon: PanelBottom,
        color: 'text-violet-500',
      },
    ],
  },
  {
    title: 'reset_session',
    href: '/settings/session',
    icon: RotateCcw,
    childColor: 'text-red-500',
    superAdminOnly: true,
  },
]

export function SettingsMenu() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(true)
  const user = useAuthStore((s) => s.user)

  const visibleGroups = settingsMenuGroups.filter(
    (group) => !group.superAdminOnly || user?.role_name === 'Super Admin'
  )

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  const isGroupActive = (group: SettingsMenuGroup) =>
    (group.href && isActive(group.href)) ||
    group.children?.some((child) => isActive(child.href)) ||
    false

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
              {visibleGroups.map((group) => {
                if (!group.children) {
                  const active = group.href ? isActive(group.href) : false
                  return (
                    <Link
                      key={group.title}
                      to={group.href ?? '/settings'}
                      className={cn(
                        'flex items-center gap-2 rounded-md py-1.5 pr-2 pl-8 text-sm hover:bg-accent',
                        active
                          ? 'bg-accent font-medium text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <group.icon className={cn('size-4 shrink-0', group.childColor)} />
                      <span className="truncate">{t(group.title)}</span>
                    </Link>
                  )
                }
                return (
                  <Collapsible
                    key={group.title}
                    defaultOpen={isGroupActive(group)}
                    className="group/sub"
                  >
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          'flex w-full cursor-pointer items-center gap-2 rounded-md py-1.5 pr-2 pl-8 text-sm hover:bg-accent',
                          isGroupActive(group)
                            ? 'font-medium text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <group.icon className="size-4 shrink-0" />
                        <span className="flex-1 truncate text-left">{t(group.title)}</span>
                        <ChevronRight className="size-3.5 text-muted-foreground transition-transform group-data-[state=open]/sub:rotate-90" />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="flex flex-col gap-0.5 pt-0.5">
                        {group.children.map((child) => {
                          const active = isActive(child.href)
                          return (
                            <Link
                              key={`${child.href}-${child.title}`}
                              to={child.href}
                              className={cn(
                                'flex items-center gap-2 rounded-md py-1.5 pr-2 pl-14 text-sm hover:bg-accent',
                                active
                                  ? 'bg-accent font-medium text-foreground'
                                  : 'text-muted-foreground hover:text-foreground'
                              )}
                            >
                              <child.icon className={cn('size-4 shrink-0', child.color)} />
                              <span className="truncate">{t(child.title)}</span>
                            </Link>
                          )
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

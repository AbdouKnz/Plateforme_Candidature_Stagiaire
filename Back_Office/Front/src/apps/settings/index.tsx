import { useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { Separator } from '@/components/ui/separator'
import { IconSettings } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { GraduationCap, Laptop, IdCard, Clock, Tags, Building2, Mail, MailCheck, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, type VercelTab } from '@/components/ui/vercel-tabs'

interface SettingsNavItem {
  title: string
  href: string
  icon: LucideIcon
  color: string
}

const managementNavItems: SettingsNavItem[] = [
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

export function Settings() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const tabs: VercelTab[] = useMemo(
    () =>
      managementNavItems.map((item) => ({
        id: item.href,
        label: t(item.title),
        icon: <item.icon className={cn('size-[18px] shrink-0', item.color)} />,
      })),
    [t]
  )

  const activeTab = useMemo(() => {
    const exact = managementNavItems.find((item) => item.href === pathname)?.href
    if (exact) return exact
    return managementNavItems.find((item) => pathname.startsWith(item.href))?.href
  }, [pathname])

  return (
    <div className="flex flex-col grow overflow-hidden">
      <div className="px-4 py-6 pb-0">
        <div className="mb-2 flex flex-wrap items-center space-x-2">
          <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <IconSettings className="size-5" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{t("settings")}</h2>
        </div>
        <Separator className='my-4' />
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(href) => navigate({ to: href })}
          fill
          large
          className="no-scrollbar mb-4 w-full overflow-x-auto"
        />
      </div>
      <Outlet />
    </div>
  )
}

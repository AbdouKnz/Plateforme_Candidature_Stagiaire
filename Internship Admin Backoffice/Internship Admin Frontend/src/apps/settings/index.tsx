import { useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { Separator } from '@/components/ui/separator'
import { IconSettings } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { GraduationCap, Laptop, IdCard, Clock, Tags, Mail, MailCheck, PanelBottom, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, type VercelTab } from '@/components/ui/vercel-tabs'
import { frontOfficeTabs, parseFrontOfficeTab, type FrontOfficeTabId } from './front-office/tabs'

interface SettingsTabItem {
  title: string
  href: string
  icon: LucideIcon
  color: string
}

// Group 1 — Application And Subject (degrees, application types,
// technologies, durations, profiles)
const applicationTabItems: SettingsTabItem[] = [
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
]

// Group 2 — Emails (email templates, email config, footer)
const emailTabItems: SettingsTabItem[] = [
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
]

// Front Office owns state-driven inner tabs (status | internship title |
// footer) rendered in this same top bar via ?tab=; Reset Session is a single
// page with no tabs.
function groupForPath(pathname: string): 'application' | 'emails' | 'front-office' | null {
  if (applicationTabItems.some((item) => pathname.startsWith(item.href))) {
    return 'application'
  }
  if (emailTabItems.some((item) => pathname.startsWith(item.href))) {
    return 'emails'
  }
  if (pathname.startsWith('/settings/front-office')) {
    return 'front-office'
  }
  return null
}

export function Settings() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const search = useLocation({ select: (location) => location.search })

  const group = groupForPath(pathname)
  const navItems = useMemo(
    () =>
      group === 'application'
        ? applicationTabItems
        : group === 'emails'
          ? emailTabItems
          : [],
    [group]
  )
  const frontOfficeTab = parseFrontOfficeTab(
    (search as Record<string, unknown> | undefined)?.tab
  )

  const tabs: VercelTab[] = useMemo(
    () =>
      group === 'front-office'
        ? frontOfficeTabs.map((item) => ({
            id: item.id,
            label: t(item.title),
            icon: <item.icon className={cn('size-[18px] shrink-0', item.color)} />,
          }))
        : navItems.map((item) => ({
            id: item.href,
            label: t(item.title),
            icon: <item.icon className={cn('size-[18px] shrink-0', item.color)} />,
          })),
    [t, group, navItems]
  )

  const activeTab = useMemo(() => {
    if (group === 'front-office') return frontOfficeTab
    const exact = navItems.find((item) => item.href === pathname)?.href
    if (exact) return exact
    return navItems.find((item) => pathname.startsWith(item.href))?.href
  }, [pathname, group, navItems, frontOfficeTab])

  const handleTabChange = (id: string) => {
    if (group === 'front-office') {
      navigate({
        to: '/settings/front-office',
        search: (prev) => ({ ...prev, tab: id as FrontOfficeTabId }),
      })
    } else {
      navigate({ to: id })
    }
  }

  const showTabs = group !== null

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
        {showTabs && (
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            fill
            large
            className="no-scrollbar mb-4 w-full overflow-x-auto"
          />
        )}
      </div>
      <Outlet />
    </div>
  )
}

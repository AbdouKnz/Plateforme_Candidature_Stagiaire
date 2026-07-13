import { Link, Outlet, useLocation } from '@tanstack/react-router'
import { Separator } from '@/components/ui/separator'
import { IconSettings } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { GraduationCap, Laptop, IdCard, Clock, Tags, Building2, Mail, MailCheck } from 'lucide-react'

const managementNavItems = [
  {
    title: 'degree_management',
    href: '/settings/degrees',
    icon: GraduationCap,
  },
  {
    title: 'duration_management',
    href: '/settings/durations',
    icon: Clock,
  },
  {
    title: 'profile_management',
    href: '/settings/profiles',
    icon: IdCard,
  },
  {
    title: 'technology_management',
    href: '/settings/technologies',
    icon: Laptop,
  },
  {
    title: 'type_management',
    href: '/settings/types',
    icon: Tags,
  },
  {
    title: 'email_template_management',
    href: '/settings/email-templates',
    icon: Mail,
  },
  {
    title: 'mail_config_management',
    href: '/settings/mail-config',
    icon: MailCheck,
  },
  {
    title: 'front_office_management',
    href: '/settings/front-office',
    icon: Building2,
  },
]

export function Settings() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

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
        <nav className='flex flex-nowrap gap-0.5 py-1 mb-4'>
          {managementNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                pathname === item.href
                  ? 'bg-muted'
                  : 'hover:bg-accent hover:underline',
                'justify-start shrink-0 whitespace-nowrap px-2'
              )}
            >
              <item.icon className="size-4 me-1.5" />
              {t(item.title)}
            </Link>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  )
}

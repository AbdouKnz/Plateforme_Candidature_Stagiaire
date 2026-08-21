import { Outlet } from '@tanstack/react-router'
import { Separator } from '@/components/ui/separator'
import { IconSettings } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { GraduationCap, Laptop, IdCard, Clock, Tags, Building2, Mail, MailCheck } from 'lucide-react'
import { GlowNav, type GlowNavItem } from '@/components/shared/glow-nav'

const managementNavItems: GlowNavItem[] = [
  {
    title: 'degree_management',
    href: '/settings/degrees',
    icon: GraduationCap,
    color: 'text-indigo-500',
    gradient:
      'radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(79,70,229,0.08) 50%, rgba(67,56,202,0) 100%)',
  },
  {
    title: 'duration_management',
    href: '/settings/durations',
    icon: Clock,
    color: 'text-amber-500',
    gradient:
      'radial-gradient(circle, rgba(245,158,11,0.18) 0%, rgba(217,119,6,0.08) 50%, rgba(180,83,9,0) 100%)',
  },
  {
    title: 'profile_management',
    href: '/settings/profiles',
    icon: IdCard,
    color: 'text-sky-500',
    gradient:
      'radial-gradient(circle, rgba(14,165,233,0.18) 0%, rgba(2,132,199,0.08) 50%, rgba(3,105,161,0) 100%)',
  },
  {
    title: 'technology_management',
    href: '/settings/technologies',
    icon: Laptop,
    color: 'text-violet-500',
    gradient:
      'radial-gradient(circle, rgba(139,92,246,0.18) 0%, rgba(124,58,237,0.08) 50%, rgba(109,40,217,0) 100%)',
  },
  {
    title: 'type_management',
    href: '/settings/types',
    icon: Tags,
    color: 'text-rose-500',
    gradient:
      'radial-gradient(circle, rgba(244,63,94,0.18) 0%, rgba(225,29,72,0.08) 50%, rgba(190,18,60,0) 100%)',
  },
  {
    title: 'email_template_management',
    href: '/settings/email-templates',
    icon: Mail,
    color: 'text-emerald-500',
    gradient:
      'radial-gradient(circle, rgba(16,185,129,0.18) 0%, rgba(5,150,105,0.08) 50%, rgba(4,120,87,0) 100%)',
  },
  {
    title: 'mail_config_management',
    href: '/settings/mail-config',
    icon: MailCheck,
    color: 'text-cyan-500',
    gradient:
      'radial-gradient(circle, rgba(6,182,212,0.18) 0%, rgba(8,145,178,0.08) 50%, rgba(14,116,144,0) 100%)',
  },
  {
    title: 'front_office_management',
    href: '/settings/front-office',
    icon: Building2,
    color: 'text-orange-500',
    gradient:
      'radial-gradient(circle, rgba(249,115,22,0.18) 0%, rgba(234,88,12,0.08) 50%, rgba(194,65,12,0) 100%)',
  },
]

export function Settings() {
  const { t } = useTranslation()

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
        <GlowNav items={managementNavItems} className="mb-4" />
      </div>
      <Outlet />
    </div>
  )
}

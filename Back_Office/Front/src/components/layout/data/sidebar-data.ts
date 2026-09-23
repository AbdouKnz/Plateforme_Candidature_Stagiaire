import { ModuleEnum } from '@/models/module-model'
import { SidebarData } from '@/models/sidebar-model'
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Command,
  ClipboardList,
  BookOpen,
  FileText,
  Send,
  Settings,
  Layers,
  Mail,
  Building2,
  RotateCcw,
} from 'lucide-react'

export const sidebarData: SidebarData = {
  user: {
    name: 'admin',
    email: 'admin@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'AstroIntern',
      logo: Command,
    },
  ],
  navGroups: [
    {
      title: 'general',
      items: [
        {
          title: 'dashboard',
          url: '/',
          icon: LayoutDashboard,
          module: ModuleEnum.Dashboard,
        },
      ],
    },
    {
      title: 'management', 
      items: [
        {
          title: 'role_management',
          url: '/roles',
          icon: ShieldCheck,
          module: ModuleEnum.Roles,
        },
        {
          title: 'user_management',
          url: '/users',
          icon: Users,
          module: ModuleEnum.Users,
        },
        {
          title: 'subject_management',
          url: '/subjects',
          icon: BookOpen,
          module: ModuleEnum.Subjects,
        },
      ],
    },
    {
      title: 'reporting', 
      items: [
        {
          title: 'candidature_management',
          url: '/candidatures',
          icon: FileText,
          module: ModuleEnum.Candidatures,
        },
        {
          title: 'audits',
          url: '/audits',
          icon: ClipboardList,
          module: ModuleEnum.Audits,
        },
        {
          title: 'email_logs',
          url: '/email-logs',
          icon: Send,
          module: ModuleEnum.EmailLogs,
        },
      ],
    },
    {
      title: 'settings',
      items: [
        {
          title: 'settings',
          icon: Settings,
          module: ModuleEnum.Settings,
          items: [
            {
              title: 'settings_group_application',
              url: '/settings/degrees',
              icon: Layers,
              module: ModuleEnum.Settings,
              matchUrls: [
                '/settings/degrees',
                '/settings/types',
                '/settings/technologies',
                '/settings/durations',
                '/settings/profiles',
              ],
            },
            {
              title: 'settings_group_emails',
              url: '/settings/email-templates',
              icon: Mail,
              module: ModuleEnum.Settings,
              matchUrls: ['/settings/email-templates', '/settings/mail-config', '/settings/email-footer'],
            },
            {
              title: 'settings_group_front_office',
              url: '/settings/front-office',
              icon: Building2,
              module: ModuleEnum.Settings,
            },
            {
              title: 'reset_session',
              url: '/settings/session',
              icon: RotateCcw,
              module: ModuleEnum.Settings,
              superAdminOnly: true,
            },
          ],
        },
      ],
    },
  ],
}
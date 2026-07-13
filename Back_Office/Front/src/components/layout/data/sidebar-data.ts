import { ModuleEnum } from '@/models/module-model'
import { SidebarData } from '@/models/sidebar-model'
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Command,
  ClipboardList,
  GraduationCap,
  Laptop,
  IdCard,
  Clock,
  Tags,
  BookOpen,
  FileText,
  Settings,
  Send,
} from 'lucide-react'

export const sidebarData: SidebarData = {
  user: {
    name: 'admin',
    email: 'admin@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Internship',
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
          url: '/settings',
          icon: Settings,
          module: ModuleEnum.Settings,
        },
      ],
    },
  ],
}
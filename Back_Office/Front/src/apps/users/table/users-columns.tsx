import { ColumnDef } from '@tanstack/react-table'
import { DialogEnum } from '@/models/alert-model'
import { User, UserRole } from '@/models/user-model'
import {
  IconCash,
  IconShield,
  IconUser,
  IconUsers,
  IconUserShield,
} from '@tabler/icons-react'
import { BanIcon, CheckCircleIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useUsersStore } from '@/stores/users-store'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/use-permissions'
import { Badge } from '@/components/ui/badge'
import { LongText } from '@/components/long-text'
import {
  DataTableColumnHeader,
  DataTableRowActions,
} from '@/components/shared/data-table'

export const useUserColumns = (): ColumnDef<User>[] => {
  const { t } = useTranslation()

  const userTypes: { label: string; value: UserRole; icon: any }[] = [
    { label: 'super_admin', value: UserRole.SUPER_ADMIN, icon: IconShield },
    { label: 'admin', value: UserRole.ADMIN, icon: IconUserShield },
    { label: 'manager', value: UserRole.MANAGER, icon: IconUsers },
    { label: 'cashier', value: UserRole.CASHIER, icon: IconCash },
    { label: 'user', value: UserRole.USER, icon: IconUser },
  ]

  return [
    {
      accessorKey: 'first_name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('first_name')} />
      ),
      cell: ({ row }) => (
        <LongText className='max-w-36'>{row.original.first_name}</LongText>
      ),
      meta: { className: cn('sticky left-4 md:table-cell'), label: t('first_name') },
      enableHiding: false,
    },
    {
      accessorKey: 'last_name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('last_name')} />
      ),
      cell: ({ row }) => (
        <LongText className='max-w-36'>{row.original.last_name}</LongText>
      ),
      meta: { label: t('last_name') },
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('email')} />
      ),
      cell: ({ row }) => (
        <div className='w-fit text-nowrap'>{row.original.email}</div>
      ),
      meta: { label: t('email') },
    },
    {
      accessorKey: 'role_name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('role')} />
      ),
      cell: ({ row }) => {
        const role = row.original.role_name
        const userType = userTypes.find((u) => u.value === role.toLowerCase())

        return (
          <div className='flex items-center gap-x-2'>
            {userType?.icon && (
              <userType.icon size={16} className='text-muted-foreground' />
            )}
            <span className='text-sm capitalize'>{role}</span>
          </div>
        )
      },
      filterFn: (row, id, value) => value.includes(row.original.role_name),
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('status')} />
      ),
      meta: { label: t('status') },
      cell: ({ row }) => {
        const isActive = row.original.status
        const badgeVariant = isActive ? 'success' : 'destructive'
        const icon = isActive ? (
          <CheckCircleIcon className='size-3' />
        ) : (
          <BanIcon className='size-3' />
        )
        return (
          <div className='flex items-center space-x-2'>
            <Badge variant={badgeVariant} className='capitalize'>
              {icon}
              {row.original.status ? t('enabled') : t('disabled')}
            </Badge>
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const b = rowA.original.status ? 1 : 0
        const a = rowB.original.status ? 1 : 0
        return a - b
      },
      enableSorting: true,
      enableHiding: true,
    },

    {
      accessorKey: 'updated_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('updated_at')} />
      ),
      meta: { label: t('updated_at') },
      cell: ({ row }) => (
        <Badge variant='secondary' className='max-w-38 text-xs'>
          <LongText>{row.original.updated_at}</LongText>
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('actions')}
          className='mr-4 flex justify-end'
        />
      ),
      cell: ({ row }) => {
        const { setOpen, setCurrentUserId } = useUsersStore()
        const { modulePermissions } = usePermissions()
        const isSuperAdmin = row.original.user_id === 1
        const isBlocked = !row.original.status
        const tooltipMessage = isBlocked
          ? t('activate_user')
          : t('deactivate_user')
        return (
          <DataTableRowActions
            row={row}
            isBlocked={isBlocked}
            tooltipMessage={tooltipMessage}
            className='mr-4 justify-end'
            onView={(data) => {
              setCurrentUserId(data.user_id)
              setOpen(DialogEnum.VIEW)
            }}
            onEdit={(data) => {
              setCurrentUserId(data.user_id)
              setOpen(DialogEnum.EDIT)
            }}
            onDelete={(data) => {
              setCurrentUserId(data.user_id)
              setOpen(DialogEnum.DELETE)
            }}
            onBlock={(data) => {
              setCurrentUserId(data.user_id)
              setOpen(DialogEnum.BLOCK)
            }}
            canView={modulePermissions.users.canView}
            canEdit={!isSuperAdmin && modulePermissions.users.canUpdate}
            canDelete={!isSuperAdmin && modulePermissions.users.canDelete}
          />
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
  ]
}

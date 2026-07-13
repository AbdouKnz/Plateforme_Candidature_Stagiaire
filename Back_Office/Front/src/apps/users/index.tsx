import { useMemo } from 'react'
import {
  IconInfoCircle,
  IconUserCheck,
  IconUsers,
  IconUsersGroup,
  IconUserX,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useUsersStore } from '@/stores/users-store'
import { useUsers } from '@/hooks/use-users'
import { DialogEnum } from '@/models/alert-model'
import { Card } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Main } from '@/components/layout/main'
import { DataTable } from '@/components/shared/data-table'
import { useUserToolbarProps } from './table/data'
import { useUserColumns } from './table/users-columns'
import { UsersModals } from './users-modal'

export function Users() {
  const { t } = useTranslation()
  const { queryParams, setQueryParams, currentUserId, open } = useUsersStore()
  const selectedUserId = open === DialogEnum.VIEW ? currentUserId : null
  const { data: usersResponse, isLoading } = useUsers(queryParams)
  const data = useMemo(() => usersResponse?.data ?? [], [usersResponse?.data])
  const pagination = useMemo(
    () => usersResponse?.pagination ?? undefined,
    [usersResponse?.pagination]
  )
  const toolbarProps = useUserToolbarProps()
  const columns = useUserColumns()
  const totalUsers = pagination?.totalRows ?? 0
  const enabledUsers = pagination?.totalEnabled ?? 0
  const disabledUsers = pagination?.totalDisabled ?? 0

  return (
    <>
      <Main>
        <div className='mb-2 flex flex-wrap items-center space-x-2'>
          <div className='bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
            <IconUsers className='size-5' />
          </div>

          <h2 className='text-2xl font-bold tracking-tight'>
            {t('user_management')}
          </h2>
        </div>

        <div className='mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Card className='bg-card text-card-foreground gap-0 rounded-xl border p-0 shadow-sm'>
            <div className='flex flex-row items-center justify-between space-y-0 p-6 pt-4 pb-2'>
              <div className='flex items-center gap-2 text-sm font-medium tracking-tight'>
                <IconUsersGroup className='size-5' />
                {t('total_users')}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle
                    size={24}
                    strokeWidth={1.25}
                    className='text-muted-foreground'
                  />
                </TooltipTrigger>

                <TooltipContent>{t('total_users_tooltip')}</TooltipContent>
              </Tooltip>
            </div>
            <div className='p-6 pt-0 pb-4'>
              <div className='text-2xl font-bold'>{totalUsers}</div>
            </div>
          </Card>
          <Card className='bg-card text-card-foreground gap-0 rounded-xl border p-0 shadow-sm'>
            <div className='flex flex-row items-center justify-between space-y-0 p-6 pt-4 pb-2'>
              <div className='flex items-center gap-2 text-sm font-medium tracking-tight'>
                <IconUserCheck className='size-5' />
                {t('enabled_users')}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle
                    size={24}
                    strokeWidth={1.25}
                    className='text-muted-foreground'
                  />
                </TooltipTrigger>

                <TooltipContent>{t('enabled_users_tooltip')}</TooltipContent>
              </Tooltip>
            </div>
            <div className='p-6 pt-0 pb-4'>
              <div className='text-2xl font-bold'>{enabledUsers}</div>
            </div>
          </Card>
          <Card className='bg-card text-card-foreground gap-0 rounded-xl border p-0 shadow-sm'>
            <div className='flex flex-row items-center justify-between space-y-0 p-6 pt-4 pb-2'>
              <div className='flex items-center gap-2 text-sm font-medium tracking-tight'>
                <IconUserX className='size-5' />
                {t('disabled_users')}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle
                    size={24}
                    strokeWidth={1.25}
                    className='text-muted-foreground'
                  />
                </TooltipTrigger>

                <TooltipContent>{t('disabled_users_tooltip')}</TooltipContent>
              </Tooltip>
            </div>
            <div className='p-6 pt-0 pb-4'>
              <div className='text-2xl font-bold'>{disabledUsers}</div>
            </div>
          </Card>
        </div>

        <div className='-mx-4 mt-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <DataTable
            data={data}
            columns={columns}
            toolbarProps={toolbarProps}
            isLoading={isLoading}
            queryParams={queryParams}
            setQueryParams={setQueryParams}
            pagination={pagination}
            selectedRowId={selectedUserId}
          />
        </div>
      </Main>
      <UsersModals />
    </>
  )
}

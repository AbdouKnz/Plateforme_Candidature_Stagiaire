import { DialogEnum } from '@/models/alert-model'
import { useTranslation } from 'react-i18next'
import { useUsersStore } from '@/stores/users-store'
import { useRoles } from '@/hooks/use-roles'
import { useDeleteUser, useUpdateUser, useUser } from '@/hooks/use-users'
import { DeleteAlert } from '@/components/shared/alert/delete-alert'
import { StatusAlert } from '@/components/shared/alert/status-alert'
import { UsersActionModal } from './users-action-modal'

export function UsersModals() {
  const { t } = useTranslation()
  const { open, setOpen, currentUserId, setCurrentUserId } = useUsersStore()
  const { data: user } = useUser(currentUserId)
  const { data: roles } = useRoles()
  const deleteUserMutation = useDeleteUser()
  const updateStatusMutation = useUpdateUser()

  const isBlocked = user?.status

  const statusAction = isBlocked ? t('deactivate') : t('activate')

  const statusTitle = t('confirm_user_status_change', { action: statusAction })
  const confirmDeleteText = t('confirm_delete')
  const statusLoadingText = isBlocked ? t('disabling') : t('enabling')
  const unblockButtonText = t('activate')
  const blockButtonText = t('deactivate')

  const handleCloseModal = () => {
    setOpen(null)
    setCurrentUserId(null)
  }

  const handleDelete = () => {
    if (!user) return

    deleteUserMutation.mutate(user.user_id, {
      onSuccess: () => {
        handleCloseModal()
      },
    })
  }

  const handleUpdateStatus = () => {
    if (!user) return

    updateStatusMutation.mutate(
      {
        id: user.user_id,
        data: { status: !user.status },
      },
      {
        onSuccess: () => {
          handleCloseModal()
        },
      }
    )
  }

  return (
    <>
      <UsersActionModal
        open={open === DialogEnum.ADD}
        onClose={handleCloseModal}
        mode={DialogEnum.ADD}
        roles={roles}
      />

      {user && (
        <>
          <UsersActionModal
            open={open === DialogEnum.VIEW || open === DialogEnum.EDIT}
            onClose={handleCloseModal}
            user={user}
            roles={roles}
            mode={open as DialogEnum.VIEW | DialogEnum.EDIT}
            switchToEdit={() => setOpen(DialogEnum.EDIT)}
          />

          <DeleteAlert
            open={open === DialogEnum.DELETE}
            onClose={handleCloseModal}
            onConfirm={handleDelete}
            isLoading={deleteUserMutation.isPending}
            data={user}
            confirmDeleteText={confirmDeleteText}
          />

          <StatusAlert
            isBlocked={!!isBlocked}
            open={open === DialogEnum.BLOCK}
            onClose={handleCloseModal}
            isLoading={updateStatusMutation.isPending}
            onConfirm={handleUpdateStatus}
            title={statusTitle}
            blockLoadingText={statusLoadingText}
            unblockLoadingText={statusLoadingText}
            unblockButtonText={unblockButtonText}
            blockButtonText={blockButtonText}
          />
        </>
      )}
    </>
  )
}

import { AxiosError } from 'axios'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { AlertEnum } from '@/models/alert-model'
import { ID } from '@/models/api'
import { FileType } from '@/models/export-model'
import {
  ChangePasswordPayload,
  User,
  UserQueryParams,
  UserResponse,
  UserStatus,
} from '@/models/user-model'
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  exportUsers,
  changePassword,
} from '@/service/users'
import { useAlertStore } from '@/stores/alert-store'

export function useUsers(params?: UserQueryParams) {
  return useQuery<UserResponse, Error>({
    queryKey: ['users', params],
    queryFn: () => getUsers(params),
    retry: 1,
    onError: (error: Error) => {
      console.error('Error fetching users:', error)
    },
  } as UseQueryOptions<UserResponse, Error>)
}

export function useUser(id: ID) {
  const { showAlert } = useAlertStore()

  return useQuery<User, AxiosError>({
    queryKey: ['user', id],
    queryFn: () => getUserById(id!),
    enabled: !!id,
    retry: 1,
    onError: (error: any) => {
      console.error(`Error fetching user ${id}:`, error.message)
      showAlert({
        message: error?.response?.data?.error,
        type: AlertEnum.ERROR,
      })
    },
  } as UseQueryOptions<User, AxiosError>)
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  const { showAlert } = useAlertStore()

  return useMutation<UserResponse, Error, Partial<User>>({
    mutationFn: createUser,
    onSuccess: (data) => {
      console.log('User created successfully:', data)
      showAlert({
        message: data?.message,
        type: AlertEnum.SUCCESS,
      })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: any) => {
      console.error('Error creating user:', error)
      showAlert({
        message: error?.response?.data?.error,
        type: AlertEnum.ERROR,
      })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  const { showAlert } = useAlertStore()

  return useMutation<UserResponse, Error, { id: number; data: Partial<User> }>({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: (data, variables) => {
      console.log('User updated successfully:', data)

      queryClient.invalidateQueries({ queryKey: ['users'] })

      queryClient.invalidateQueries({ queryKey: ['user', variables.id] })

      showAlert({
        message: data?.message,
        type: AlertEnum.SUCCESS,
      })
    },
    onError: (error: any) => {
      console.error('Error updating user:', error.message)

      showAlert({
        message: error?.response?.data?.error,
        type: AlertEnum.ERROR,
      })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  const { showAlert } = useAlertStore()

  return useMutation<UserResponse, Error, number>({
    mutationFn: (userId) => deleteUser(userId),
    onSuccess: (data) => {
      console.log('User deleted successfully:', data)
      queryClient.invalidateQueries({ queryKey: ['users'] })
      showAlert({
        message: data?.message,
        type: AlertEnum.SUCCESS,
      })
    },
    onError: (error: any) => {
      console.error('Error deleting user:', error.message)
      showAlert({
        message: error?.response?.data?.error,
        type: AlertEnum.ERROR,
      })
    },
  })
}

export function useExportUsers() {
  const { showAlert } = useAlertStore()

  return useMutation<
    void,
    Error,
    { fileType: FileType; params?: UserQueryParams }
  >({
    mutationFn: ({ fileType, params }) => {
      console.log('Export parameters:', { fileType, params })
      return exportUsers(fileType, params)
    },
    onSuccess: () => {
      showAlert({
        message: 'Users exported successfully!',
        type: AlertEnum.SUCCESS,
      })
    },
    onError: (error: any) => {
      console.error('Error exporting users:', error)
      showAlert({
        message:
          error?.response?.data?.message ||
          'An error occurred while exporting users!',
        type: AlertEnum.ERROR,
      })
    },
  })
}

export function useChangePassword() {
  const { showAlert } = useAlertStore()

  return useMutation<
    UserResponse,
    Error,
    { id: number; payload: ChangePasswordPayload }
  >({
    mutationFn: ({ id, payload }) => changePassword(id, payload),
    onSuccess: (data) => {
      console.log('User password updated successfully:', data)

      showAlert({ message: data?.message, type: AlertEnum.SUCCESS })
    },
    onError: (error: any) => {
      console.error('Error updating user password:', error)

      showAlert({
        message: error?.response?.data?.error,
        type: AlertEnum.ERROR,
      })
    },
  })
}

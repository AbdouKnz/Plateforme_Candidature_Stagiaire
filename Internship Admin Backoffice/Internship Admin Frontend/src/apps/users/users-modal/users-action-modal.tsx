import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { DialogEnum, ModalMode } from '@/models/alert-model'
import { Role } from '@/models/role-model'
import { User } from '@/models/user-model'
import { IconEdit, IconEye, IconPlus } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/use-permissions'
import { useCreateUser, useUpdateUser } from '@/hooks/use-users'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/shadcn-io/spinner'
import { PasswordInput } from '@/components/password-input'
import { SelectDropdown } from '@/components/select-dropdown'

const formSchema = z.object({
  first_name: z
    .string()
    .nonempty({ message: 'First Name is required.' })
    .min(3, { message: 'Name must be at least 3 characters long.' }),
  last_name: z
    .string()
    .nonempty({ message: 'Last Name is required.' })
    .min(3, { message: 'Username must be at least 3 characters long.' }),
  email: z
    .string()
    .min(1, { message: 'Email is required.' })
    .email({ message: 'Email is invalid.' }),
  role_id: z.string().min(1, 'Role is required'),
  password: z
    .string()
    .nonempty({ message: 'Password is required.' })
    .min(6, { message: 'Password must be at least 6 characters long.' }),
})

const editSchema = formSchema.extend({
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters long.' })
    .optional()
    .or(z.literal('')),
})

type BaseForm = z.infer<typeof formSchema>
type EditUserForm = z.infer<typeof editSchema>
type UserForm = BaseForm | EditUserForm

interface Props {
  user?: User
  roles?: Role[]

  open: boolean
  onClose: () => void
  mode?: ModalMode
  switchToEdit?: () => void
}

export function UsersActionModal({
  user,
  roles,
  open,
  onClose,
  mode,
  switchToEdit,
}: Props) {
  const { t } = useTranslation()
  const isEdit = mode === DialogEnum.EDIT
  const isView = mode === DialogEnum.VIEW
  const isAdd = mode === DialogEnum.ADD
  const { modulePermissions } = usePermissions()

  const canUpdateUser = modulePermissions.users.canUpdate
  const isSuperAdmin = user?.role_id === 1

  const { mutate: createUser, isPending: isCreating } = useCreateUser()
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser()
  const handleClose = () => {
    form.reset()
    onClose()
  }
  const schema = isEdit ? editSchema : formSchema
  const form = useForm<UserForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      role_id: '',
      password: '',
    },
  })

  useEffect(() => {
    if (user) {
      form.reset({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        role_id: String(user.role_id) || '',
        password: '',
      })
    } else {
      form.reset({
        first_name: '',
        last_name: '',
        email: '',
        role_id: '',
        password: '',
      })
    }
  }, [user, form])

  const onSubmit = (values: UserForm) => {
    const payload = {
      ...values,
      role_id: parseInt(values.role_id),
    }
    if (isEdit && user) {
      updateUser(
        { id: user.user_id, data: payload },
        { onSuccess: handleClose }
      )
    } else if (isAdd) {
      createUser(payload, { onSuccess: handleClose })
    }
  }

  const badgeVariant = user?.status ? 'success' : 'destructive'
  const statusText = user?.status ? t('active') : t('inactive')
  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        form.reset()
        onClose()
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='border-b pb-3 text-left'>
          <DialogTitle className='flex items-center gap-2'>
            <div className='bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
              {isEdit ? (
                <IconEdit className='size-5' />
              ) : isView ? (
                <IconEye className='size-5' />
              ) : (
                <IconPlus className='size-5' />
              )}
            </div>

            {isEdit ? t('edit_user') : isView ? t('view_user') : t('add_user')}
          </DialogTitle>
        </DialogHeader>
        <div className='-mr-4 h-[26.25rem] w-full overflow-y-auto py-1 pr-4'>
          <Form {...form}>
            <form
              id='user-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 p-0.5'
            >
              <FormField
                control={form.control}
                name='first_name'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      {t('first_name')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('first_name_placeholder')}
                        className='col-span-4'
                        autoComplete='off'
                        disabled={isView}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='last_name'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      {t('last_name')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('last_name_placeholder')}
                        className='col-span-4'
                        disabled={isView}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      {t('email')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('email_placeholder')}
                        className='col-span-4'
                        disabled={isView}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='role_id'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                     
                      {t('role')}
                    </FormLabel>
                    <SelectDropdown
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder={t('select_role')}
                      disabled={isView}
                      className='col-span-4'
                      items={
                        roles?.map((role) => ({
                          value: String(role.role_id),
                          label: role.role_name,
                        })) || []
                      }
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      {t('password')}
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                          placeholder={t("password_placeholder")}
                        className='col-span-4'
                        disabled={isView}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            </form>
            {isView && user && (
              <FormItem className='mt-6 grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                <FormLabel className='col-span-2 text-right'>{t('status')}</FormLabel>
                <FormControl className='col-span-4'>
                  <Badge variant={badgeVariant} className={cn('capitalize')}>
                    {statusText}
                  </Badge>
                </FormControl>
                <FormMessage className='col-span-4 col-start-3' />
              </FormItem>
            )}
          </Form>
        </div>
        <DialogFooter>
          <Button variant='outline' type='button' onClick={handleClose}>
            {t('cancel')}
          </Button>
          {isView && canUpdateUser && !isSuperAdmin && (
            <Button
              form='user-form'
              onClick={() => {
                if (switchToEdit) switchToEdit()
              }}
            >
              {t('edit')}
            </Button>
          )}

          {!isView && (
            <Button
              type='submit'
              form='user-form'
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating ? (
                <>
                  <Spinner variant='circle' />
                  {t('submitting')}
                </>
              ) : (
                t('submit')
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

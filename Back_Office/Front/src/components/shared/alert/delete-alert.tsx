import { OctagonAlert, TrashIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import { Spinner } from '@/components/ui/shadcn-io/spinner'

interface Props {
  open: boolean
  onClose: () => void
  data?: any
  onConfirm: () => void
  isLoading?: boolean
  confirmDeleteText?: string
  description?: string
}

export function DeleteAlert({
  open,
  onClose,
  onConfirm,
  isLoading,
  confirmDeleteText,
  description,
}: Props) {
  const { t } = useTranslation()
  
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className='w-122'>
        <AlertDialogHeader className='items-center'>
          <AlertDialogTitle>
            <div className='bg-destructive/10 mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full'>
              <OctagonAlert className='text-destructive h-7 w-7 animate-pulse' />
            </div>
            {confirmDeleteText}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription className='mt-2 text-center'>
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className='mt-2 sm:justify-center'>
          <AlertDialogCancel onClick={onClose}> {t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: 'destructive2' })}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner variant='circle' />
                {t('deleting')}{' '}
              </>
            ) : (
              <>
                <TrashIcon />
                {t('delete')}{' '}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

import { Row } from '@tanstack/react-table'
import {
  IconEdit,
  IconTrash,
  IconEye,
  IconLockOpen,
  IconLock,
  IconHistory,
  IconLink,
  IconCheck,
} from '@tabler/icons-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  isBlocked?: boolean
  onView?: (data: TData) => void
  onBlock?: (data: TData) => void
  onEdit?: (data: TData) => void
  onCompare?: (data: TData) => void
  onCopyLink?: (data: TData) => string | Promise<string>
  onDelete?: (data: TData) => void
  canView?: boolean
  canEdit?: boolean
  canDelete?: boolean
  className?: string
  tooltipMessage?: string
}

export function DataTableRowActions<TData>({
  row,
  isBlocked,
  onView,
  onBlock,
  onEdit,
  onDelete,
  canView = true,
  canEdit = true,
  canDelete = true,
  onCompare,
  onCopyLink,
  className,
  tooltipMessage,
}: DataTableRowActionsProps<TData>) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const buttonClass = 'h-8 w-8 p-0'

  const handleCopyLink = async () => {
    if (!onCopyLink) return
    try {
      const link = await onCopyLink(row.original)
      if (!link) return
      await navigator.clipboard.writeText(link)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {onBlock && canEdit && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onBlock?.(row.original)}
              className={cn(
                buttonClass,
                isBlocked
                  ? 'text-green-500 hover:border-green-300 hover:text-green-600'
                  : 'text-amber-500 hover:border-amber-300 hover:text-amber-600'
              )}
            >
              {isBlocked ? <IconLockOpen size={16} /> : <IconLock size={16} />}
            </Button>
          </TooltipTrigger>
          <TooltipContent
            colorClass={cn(
              isBlocked ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'
            )}
            arrowClass={cn(
              isBlocked
                ? 'bg-green-500 fill-green-500'
                : 'bg-amber-500 fill-amber-500'
            )}
          >
            {tooltipMessage}
          </TooltipContent>
        </Tooltip>
      )}

      {onView && canView && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onView?.(row.original)}
              className={cn(
                buttonClass,
                'text-blue-500 hover:border-blue-300 hover:text-blue-600'
              )}
            >
              <IconEye size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            colorClass='bg-blue-500 text-white'
            arrowClass='bg-blue-500 fill-blue-500'
          >
            {t('view')}
          </TooltipContent>
        </Tooltip>
      )}

      {onEdit && canEdit && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onEdit?.(row.original)}
              className={cn(
                buttonClass,
                'text-green-500 hover:border-green-300 hover:text-green-600'
              )}
            >
              <IconEdit size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            colorClass='bg-green-500 text-white'
            arrowClass='bg-green-500 fill-green-500'
          >
            {t('edit')}
          </TooltipContent>
        </Tooltip>
      )}

      {onCompare && canView && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onCompare?.(row.original)}
              className={cn(
                buttonClass,
                'text-blue-500 hover:border-blue-300 hover:text-blue-600'
              )}
            >
              <IconHistory size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            colorClass='bg-blue-500 text-white'
            arrowClass='bg-blue-500 fill-blue-500'
          >
            {t('audit')}
          </TooltipContent>
        </Tooltip>
      )}

      {onCopyLink && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              onClick={handleCopyLink}
              className={cn(
                buttonClass,
                copied
                  ? 'text-green-500 hover:border-green-300 hover:text-green-600'
                  : 'text-purple-500 hover:border-purple-300 hover:text-purple-600'
              )}
            >
              {copied ? <IconCheck size={16} /> : <IconLink size={16} />}
            </Button>
          </TooltipTrigger>
          <TooltipContent
            colorClass={copied ? 'bg-green-500 text-white' : 'bg-purple-500 text-white'}
            arrowClass={copied ? 'bg-green-500 fill-green-500' : 'bg-purple-500 fill-purple-500'}
          >
            {copied ? t('link_copied') : t('copy_link')}
          </TooltipContent>
        </Tooltip>
      )}

      {onDelete && canDelete && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onDelete?.(row.original)}
              className={cn(
                buttonClass,
                'text-destructive hover:border-red-300 hover:text-red-600'
              )}
            >
              <IconTrash size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            colorClass='bg-destructive text-white'
            arrowClass='bg-destructive fill-destructive'
          >
            {t('delete')}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

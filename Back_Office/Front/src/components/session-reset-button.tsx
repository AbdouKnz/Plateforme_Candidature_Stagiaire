import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconRotateClockwise } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAuthStore } from '@/stores/auth-store'
import { SessionResetModal } from '@/components/shared/session-reset-modal'

// Global session-reset entry point (Super Admin only). Rendered in the
// authenticated layout header next to the language switch so it is visible
// from every module.
export function SessionResetButton() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const [open, setOpen] = useState(false)

  if (user?.role_name !== 'Super Admin') return null

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='scale-95 rounded-full text-destructive/80 hover:bg-destructive/10 hover:text-destructive'
              onClick={() => setOpen(true)}
            >
              <IconRotateClockwise className='size-[1.2rem]' />
              <span className='sr-only'>{t('reset', 'Reset')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t('reset_session_tooltip', 'Export and reset recruitment session')}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <SessionResetModal open={open} onOpenChange={setOpen} />
    </>
  )
}

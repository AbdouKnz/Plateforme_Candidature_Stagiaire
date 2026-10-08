import { useTranslation } from 'react-i18next'
import { format, isBefore, startOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type DatePickerProps = {
  selected: Date | undefined
  onSelect: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  disablePast?: boolean
  fromDate?: Date
  month?: Date
  fromYear?: number
  toYear?: number
  disableWeekends?: boolean
}

export function DatePicker({
  selected,
  onSelect,
  placeholder = 'Pick a date',
  disabled = false,
  disablePast = false,
  fromDate,
  month,
  fromYear,
  toYear,
  disableWeekends = false,
}: DatePickerProps) {
  const { i18n } = useTranslation()
  const locale = i18n.language === 'fr' ? fr : undefined

  const today = startOfDay(new Date())

  if (disabled) {
    return (
      <div className='w-[240px] justify-start text-start font-normal text-muted-foreground border rounded-md px-3 py-2 text-sm'>
        {selected ? format(selected, 'PPP', { locale }) : <span>{placeholder}</span>}
      </div>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          data-empty={!selected}
          className='w-[240px] justify-start text-start font-normal data-[empty=true]:text-muted-foreground'
        >
          {selected ? (
            format(selected, 'PPP', { locale })
          ) : (
            <span>{placeholder}</span>
          )}
          <CalendarIcon className='ms-auto h-4 w-4 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0'>
        <Calendar
          mode='single'
          captionLayout='dropdown'
          selected={selected}
          onSelect={onSelect}
          locale={locale}
          month={month}
          fromDate={fromDate}
          fromYear={fromYear}
          toYear={toYear}
          disabled={(date: Date) => {
            // Calendar-day precision on both sides: neither the cell date
            // nor fromDate may carry a time component into the comparison,
            // so "today" can never compare as before itself.
            const day = startOfDay(date)
            if (fromDate) {
              if (isBefore(day, startOfDay(fromDate))) return true
            }
            if (disablePast && isBefore(day, today)) return true
            if (disableWeekends) {
              const day = date.getDay()
              if (day === 0 || day === 6) return true
            }
            return false
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

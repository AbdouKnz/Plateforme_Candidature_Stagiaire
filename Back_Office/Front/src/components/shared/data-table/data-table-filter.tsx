import React from 'react'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { TableFilterProps } from '@/models/table-model'
import { IconFilter } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { SelectDropdown } from '@/components/select-dropdown'

interface DataTableFilterProps {
  tableFilterProps: TableFilterProps
}

export function DataTableFilter({
  tableFilterProps,
}: DataTableFilterProps) {
  const { t } = useTranslation()
  const { setQueryParams, resetFilterQueryParams } = tableFilterProps
  const [open, setOpen] = React.useState(false)

  const getTodayFormatted = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return format(today, 'yyyy-MM-dd HH:mm:ss')
  }

  const getDefaultValues = () => {
    const defaults = { ...tableFilterProps.formDefaultValues }

    tableFilterProps.formFields?.forEach((field) => {
      if (field.type === 'date' && !defaults[field.name]) {
        // Check if this is a "to" or end date field
        if (
          field.name.toLowerCase() === 'to' ||
          field.name.toLowerCase().includes('end')
        ) {
          // Set to today at 23:59:59
          const today = new Date()
          today.setHours(23, 59, 59, 0)
          defaults[field.name] = format(today, 'yyyy-MM-dd HH:mm:ss')
        } else {
          // For other date fields (like "from"), set to 00:00:00
          defaults[field.name] = getTodayFormatted()
        }
      }
    })

    return defaults
  }

  const form = useForm({
    defaultValues: getDefaultValues(),
  })
  const startDate = form.watch('start')
  const endDate = form.watch('end')
  function handleDateChange(field: any, date: Date | undefined) {
    if (!date) {
      field.onChange('')
      return
    }
    const formatted = format(date, 'yyyy-MM-dd HH:mm:ss')
    field.onChange(formatted)
  }

  function onSubmit(values: any) {
    const payload = { ...values }
    if (payload.status === 'all') {
      payload.status = ''
    }

    setQueryParams(payload)
    setOpen(false)
  }

  function onCancel() {
    form.reset()
    resetFilterQueryParams()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary/90 ml-auto hidden h-9 lg:flex'
        >
          <IconFilter className='mr-2 h-4 w-4' />
          {t('filter')}
        </Button>
      </PopoverTrigger>

      <PopoverContent align='end' className='w-80'>
        <div className='grid gap-4 space-y-2'>
          <div className='space-y-2'>
            <h4 className='leading-none font-medium'>{t('filter_options')}</h4>
            <Separator className='mt-4' />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <div className='grid gap-2'>
                {tableFilterProps.formFields?.map((field) => (
                  <FormField
                    key={field.name}
                    control={form.control}
                    name={field.name}
                    render={({ field: formField }) => (
                      <div className='grid grid-cols-3 items-center gap-4'>
                        <FormLabel className='col-span-1'>
                          {field.label}
                        </FormLabel>
                        <FormItem className='col-span-2'>
                          {field.type === 'dropdown' && (
                            <SelectDropdown
                              defaultValue={formField.value}
                              onValueChange={formField.onChange}
                              placeholder={`${t('select')} ${field.label.toLowerCase()}`}
                              items={field.items || []}
                              className='w-full'
                            />
                          )}
                          {field.type === 'date' && (
                            <DateTimePicker
                              value={
                                formField.value
                                  ? new Date(formField.value)
                                  : undefined
                              }
                              onChange={(date) =>
                                handleDateChange(formField, date)
                              }
                              granularity='minute'
                              displayFormat={{ hour24: 'yyyy-MM-dd HH:mm:ss' }}
                              // Restrict End Date based on Start Date
                              minDate={
                                field.name === 'end' && startDate
                                  ? new Date(startDate)
                                  : undefined
                              }
                              // Optional: Restrict Start Date based on End Date
                              maxDate={
                                field.name === 'start' && endDate
                                  ? new Date(endDate)
                                  : undefined
                              }
                            />
                          )}
                          {field.type === 'text' && (
                            <FormControl>
                              <Input
                                value={formField.value}
                                onChange={formField.onChange}
                                placeholder={`${field.label}`}
                              />
                            </FormControl>
                          )}

                          {field.type === 'number' && (
                            <FormControl>
                              <Input
                                type='number'
                                value={formField.value}
                                onChange={(e) =>
                                  formField.onChange(e.target.value)
                                }
                                placeholder={`${field.label}`}
                              />
                            </FormControl>
                          )}
                        </FormItem>
                      </div>
                    )}
                  />
                ))}
              </div>

              <div className='flex justify-end gap-2'>
                <Button variant='outline' type='button' onClick={onCancel}>
                  {t('reset_button')}
                </Button>
                <Button type='submit'>{t('apply')}</Button>
              </div>
            </form>
          </Form>
        </div>
      </PopoverContent>
    </Popover>
  )
}

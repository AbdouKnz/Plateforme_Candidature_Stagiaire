import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PaginationMetadata } from '@/models/api'
import { useTranslation } from 'react-i18next'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  queryParams?: Record<string, any>
  setQueryParams?: (params: Record<string, any>) => void
  pagination?: PaginationMetadata
}

export function DataTablePagination<TData>({
  table,
  queryParams,
  setQueryParams,
  pagination,
}: DataTablePaginationProps<TData>) {
  const { t } = useTranslation()
  const isBackendPagination = Boolean(pagination)
  const currentPage = pagination?.page ?? table.getState().pagination.pageIndex + 1
  const totalPages = pagination?.totalPages ?? table.getPageCount()

  const handleNextPage = () => {
    if (isBackendPagination) {
      if (pagination && pagination.page < pagination.totalPages) {
        setQueryParams?.({
          ...queryParams,
          page: pagination.page + 1,
        })
      }
    } else {
      table.nextPage()
    }
  }

  const handlePreviousPage = () => {
    if (isBackendPagination) {
      if (pagination && pagination.page > 1) {
        setQueryParams?.({
          ...queryParams,
          page: pagination.page - 1,
        })
      }
    } else {
      table.previousPage()
    }
  }

  const handleFirstPage = () => {
    if (isBackendPagination) {
      setQueryParams?.({ ...queryParams, page: 1 })
    } else {
      table.setPageIndex(0)
    }
  }

  const handleLastPage = () => {
    if (isBackendPagination && pagination) {
      setQueryParams?.({ ...queryParams, page: pagination.totalPages })
    } else {
      table.setPageIndex(table.getPageCount() - 1)
    }
  }

  return (
    <div
      className='flex items-center justify-between overflow-clip px-5'
      style={{ overflowClipMargin: 1 }}
    >
      <div className='text-muted-foreground hidden flex-1 text-sm sm:block'>
        {t('page')} {currentPage} {t('of')} {totalPages}
      </div>

      <div className='flex items-center sm:space-x-6 lg:space-x-8'>
        <div className='flex items-center space-x-2'>
          <p className='hidden text-sm font-medium sm:block'>{t('rows_per_page')}</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              const size = Number(value)
              table.setPageSize(size)

              if (isBackendPagination) {
                setQueryParams?.({
                  ...queryParams,
                  pageSize: size,
                  page: 1,
                })
              }
            }}
          >
            <SelectTrigger className='h-8 w-[70px]'>
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side='top'>
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            className='hidden h-8 w-8 p-0 lg:flex'
            onClick={handleFirstPage}
            disabled={currentPage === 1}
          >
            <span className='sr-only'>Go to first page</span>
            <DoubleArrowLeftIcon className='h-4 w-4' />
          </Button>

          <Button
            variant='outline'
            className='h-8 w-8 p-0'
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            <span className='sr-only'>Go to previous page</span>
            <ChevronLeftIcon className='h-4 w-4' />
          </Button>

          <Button
            variant='outline'
            className='h-8 w-8 p-0'
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
          >
            <span className='sr-only'>Go to next page</span>
            <ChevronRightIcon className='h-4 w-4' />
          </Button>

          <Button
            variant='outline'
            className='hidden h-8 w-8 p-0 lg:flex'
            onClick={handleLastPage}
            disabled={currentPage >= totalPages}
          >
            <span className='sr-only'>Go to last page</span>
            <DoubleArrowRightIcon className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  )
}

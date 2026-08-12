import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Updater,
  type VisibilityState,
} from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import type { PaginationMetadata } from '@/models/api'
import type { ToolbarProps } from '@/models/table-model'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import DataTableLoading from './data-table-loading'
import { DataTablePagination } from './data-table-pagination'
import { DataTableToolbar } from './data-table-toolbar'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string
  }
}

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  toolbarProps?: ToolbarProps
  isLoading?: boolean
  queryParams?: Record<string, any>
  setQueryParams?: (params: Record<string, any>) => void
  pagination?: PaginationMetadata
  selectedRowId?: string | number | null
  getRowId?: (row: TData) => string | number
  enableRowSelection?: boolean
  rowSelection?: Record<string, boolean>
  onRowSelectionChange?: (updater: Updater<RowSelectionState>) => void
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  toolbarProps,
  isLoading,
  queryParams,
  setQueryParams,
  pagination,
  selectedRowId,
  getRowId = (row) => (row as any).id,
  enableRowSelection = false,
  rowSelection,
  onRowSelectionChange,
}: DataTableProps<TData>) {
  const { t } = useTranslation()

  const [internalRowSelection, setInternalRowSelection] = useState({})

  const tableColumns = useMemo(() => {
    if (!enableRowSelection) return columns
    return [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label='Select all'
            className='ml-4 translate-y-[2px]'
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label='Select row'
            className='ml-4 translate-y-[2px]'
          />
        ),
        enableSorting: false,
        enableHiding: false,
        meta: { className: 'w-12' },
      },
      ...columns,
    ] as ColumnDef<TData>[]
  }, [columns, enableRowSelection])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection: rowSelection ?? internalRowSelection,
      columnFilters,
    },
    enableRowSelection,
    onRowSelectionChange: onRowSelectionChange ?? setInternalRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => String(getRowId(row)),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <div className='space-y-4'>
      <div className='rounded-md'>
        <Card paddingY='pb-4'>
          <DataTableToolbar table={table} toolbarProps={toolbarProps} />
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className='group/row'>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        className={
                          header.column.columnDef.meta?.className ?? ''
                        }
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className='h-24 text-center'
                  >
                    <DataTableLoading />
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={cn(
                      'group/row',
                      selectedRowId != null && String(getRowId(row.original)) === String(selectedRowId) && 'bg-primary/5 border-l-2 border-l-primary shadow-sm'
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          'align-middle',
                          cell.column.columnDef.meta?.className ?? ''
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className='h-24 text-center'
                  >
                    {t('no_results_found')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <DataTablePagination
            table={table}
            queryParams={queryParams}
            setQueryParams={setQueryParams}
            pagination={pagination}
          />
        </Card>
      </div>
    </div>
  )
}

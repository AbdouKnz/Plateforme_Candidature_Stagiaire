import React from 'react'
import { FileType } from '@/models/export-model'
import { FieldTypeEnum } from '@/models/table-model'
import { exportAudits } from '@/service/audit'
import { useTranslation } from 'react-i18next'
import { useAuditStore } from '@/stores/audit-store'
import { useAudits } from '@/hooks/use-audit'

export const auditActionTypes = {
  Create: { variant: 'success' as const },
  Update: { variant: 'update' as const },
  Delete: { variant: 'destructive' as const },
  'Logged in': { variant: 'login' as const },
  'Logged out': { variant: 'logout' as const },
}

export const useAuditToolbarProps = () => {
  const { t } = useTranslation()
  const { queryParams, setQueryParams, resetFilterQueryParams } =
    useAuditStore()
  const { data: auditsResponse, isLoading } = useAudits(queryParams)

  const moduleItems = React.useMemo(() => {
    if (!auditsResponse?.filters?.modules) return []
    return auditsResponse.filters.modules.map((module) => ({
      label: module,
      value: module,
    }))
  }, [auditsResponse?.filters?.modules])

  const actionItems = React.useMemo(() => {
    if (!auditsResponse?.filters?.actions) return []
    return auditsResponse.filters.actions.map((action) => ({
      label: action,
      value: action,
    }))
  }, [auditsResponse?.filters?.actions])

  return {
    tableSearchProps: {
      placeholder: t('search_audit'),
      setQueryParams,
    },
    tableFilterProps: {
      setQueryParams,
      resetFilterQueryParams,
      formDefaultValues: {
        module: '',
        action: '',
        start: undefined,
        end: undefined,
      },
      formFields: [
        {
          name: 'module',
          label: t('module'),
          type: FieldTypeEnum.DROPDOWN,
          items: moduleItems,
        },
        {
          name: 'action',
          label: t('action'),
          type: FieldTypeEnum.DROPDOWN,
          items: actionItems,
        },
        {
          name: 'start',
          label: t('start_time'),
          type: FieldTypeEnum.DATE,
        },
        {
          name: 'end',
          label: t('end_time'),
          type: FieldTypeEnum.DATE,
        },
      ],
    },

    exportFunction: (props: { fileType: FileType }) =>
      exportAudits(props.fileType, queryParams),
  }
}

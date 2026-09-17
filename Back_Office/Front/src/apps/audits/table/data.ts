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
  accept: { variant: 'success' as const },
  reject: { variant: 'destructive' as const },
  Reset: { variant: 'warning' as const },
  'Logged in': { variant: 'login' as const },
  'Logged out': { variant: 'logout' as const },
}

export const AUDIT_MODULE_LABELS: Record<string, string> = {
  EmailTemplate: 'Email Template',
  MailConfig: 'Email Config',
  Candidature: 'Applications',
}

// Display-only rename: backend still stores/filters raw values
// ("Candidature", legacy lowercase "candidature"). Case-insensitive so both
// spellings render the same label while values stay untouched.
export const formatAuditModule = (module: string) => {
  const found = Object.keys(AUDIT_MODULE_LABELS).find(
    (key) => key.toLowerCase() === module.toLowerCase()
  )
  return found ? AUDIT_MODULE_LABELS[found] : module
}

export const useAuditToolbarProps = () => {
  const { t } = useTranslation()
  const { queryParams, setQueryParams, resetFilterQueryParams } =
    useAuditStore()
  const { data: auditsResponse, isLoading } = useAudits(queryParams)

  const moduleItems = React.useMemo(() => {
    const all = [{ label: t('all'), value: 'all' }]
    if (!auditsResponse?.filters?.modules) return all
    return [
      ...all,
      ...auditsResponse.filters.modules.map((module) => ({
        label: formatAuditModule(module),
        value: module,
      })),
    ]
  }, [auditsResponse?.filters?.modules, t])

  const actionItems = React.useMemo(() => {
    const all = [{ label: t('all'), value: 'all' }]
    if (!auditsResponse?.filters?.actions) return all
    return [
      ...all,
      ...auditsResponse.filters.actions.map((action) => ({
        label: action === 'accept' ? 'Accept' : action === 'reject' ? 'Reject' : action,
        value: action,
      })),
    ]
  }, [auditsResponse?.filters?.actions, t])

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

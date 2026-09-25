import React from 'react'
import { FileType } from '@/models/export-model'
import { FieldTypeEnum } from '@/models/table-model'
import { exportAudits } from '@/service/audit'
import { useTranslation } from 'react-i18next'
import { useAuditStore } from '@/stores/audit-store'
import { useAudits } from '@/hooks/use-audit'
import { usePermissions } from '@/hooks/use-permissions'

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
  DataSetup: 'Data Setup',
  Emails: 'Emails',
  FrontOffice: 'Front Office',
  EmailTemplate: 'Email Template',
  MailConfig: 'Email Config',
  EmailFooter: 'Email Footer',
  FrontOfficeStatus: 'Front Office Status',
  FrontOfficeFooter: 'Front Office Footer',
  InternshipTitle: 'Internship Title',
  Candidature: 'Applications',
  Type: 'Application type',
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

// Translated changelog field labels for the footer / front-office modules.
// Backend keeps storing raw snake_case keys; this allowlist maps them to
// existing editor translation keys (no new i18n entries needed). Keys from
// other modules are intentionally absent so their rendering stays untouched.
export const AUDIT_FIELD_LABEL_KEYS: Record<string, string> = {
  phone: 'footer_phone',
  email: 'footer_email',
  linkedin: 'footer_linkedin',
  website: 'footer_website',
  address_url: 'footer_address',
  footer_phone: 'footer_phone',
  footer_email: 'footer_email',
  footer_linkedin: 'footer_linkedin',
  footer_website: 'footer_website',
  footer_privacy_url: 'footer_privacy_url',
  footer_terms_url: 'footer_terms_url',
  is_enabled: 'front_office_status',
  reopening_date: 'reopening_date',
  year: 'year',
  internship_title: 'internship_title',
  default_bcc: 'default_bcc',
}

export const formatAuditFieldLabel = (
  t: (key: string, options?: Record<string, unknown>) => string,
  field: string
) => {
  const translationKey = AUDIT_FIELD_LABEL_KEYS[field.toLowerCase()]
  if (!translationKey) return field
  return t(translationKey, { defaultValue: field })
}

export const useAuditToolbarProps = () => {
  const { t } = useTranslation()
  const { queryParams, setQueryParams, resetFilterQueryParams } =
    useAuditStore()
  const { modulePermissions } = usePermissions()
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

    exportFunction: modulePermissions.audits?.canCreate
      ? (props: { fileType: FileType }) =>
          exportAudits(props.fileType, queryParams)
      : undefined,
  }
}

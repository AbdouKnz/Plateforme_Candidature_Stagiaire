import { createElement, useMemo } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCandidaturesStore } from '@/stores/candidatures-store'
import { useSubjects } from '@/hooks/use-subjects'
import { useDegrees } from '@/hooks/use-degrees'
import { exportCandidatures } from '@/service/candidatures'
import type { FileType } from '@/models/export-model'
import { FieldTypeEnum } from '@/models/table-model'

export const useCandidatureToolbarProps = () => {
  const { t } = useTranslation()
  const { data: subjects } = useSubjects()
  const { data: degrees } = useDegrees()
  const { queryParams, setQueryParams, resetFilterQueryParams } =
    useCandidaturesStore()

  // NOTE: no status dropdown here on purpose. Status filtering is owned by the
  // status tabs (All / Pending / Accepted / Rejected), which filter per pipeline
  // step client-side. A server-side overall-status filter would conflict with
  // that (e.g. hiding candidates accepted in the selected step whose overall
  // status is different).
  const typeItems = [
    { label: t('solo'), value: 'solo' },
    { label: t('pair'), value: 'pair' },
  ]

  const genderItems = [
    { label: t('male'), value: 'Male' },
    { label: t('female'), value: 'Female' },
  ]

  const degreeItems = useMemo(
    () =>
      (degrees ?? []).map((d) => ({
        label: d.name,
        value: d.name,
      })),
    [degrees]
  )

  const subjectItems = useMemo(
    () =>
      (subjects ?? []).map((s) => ({
        label: s.name,
        value: s.name,
      })),
    [subjects]
  )

  // Direction-only dropdown: the table sorts by the CURRENT step's score
  // automatically (each step tab applies its own score column). Picking a
  // direction once covers every step.
  const scoreSortItems = [
    {
      label: createElement(
        'span',
        { className: 'flex items-center gap-2' },
        createElement(ArrowUp, {
          className: 'h-4 w-4',
          'aria-label': t('score_sort_ascending'),
        }),
        createElement('span', null, t('score_sort_ascending'))
      ),
      value: 'asc',
    },
    {
      label: createElement(
        'span',
        { className: 'flex items-center gap-2' },
        createElement(ArrowDown, {
          className: 'h-4 w-4',
          'aria-label': t('score_sort_descending'),
        }),
        createElement('span', null, t('score_sort_descending'))
      ),
      value: 'desc',
    },
  ]

  return {
    tableSearchProps: {
      placeholder: t('search_candidatures'),
      setQueryParams,
    },
    tableFilterProps: {
      setQueryParams,
      resetFilterQueryParams,
      formDefaultValues: {
        candidature_type: '',
        gender: '',
        degree: '',
        subject_name: '',
        score_sort: '',
      },
      formFields: [
        {
          name: 'candidature_type',
          label: t('type'),
          type: FieldTypeEnum.DROPDOWN,
          items: typeItems,
        },
        {
          name: 'gender',
          label: t('candidature_filter_gender'),
          type: FieldTypeEnum.DROPDOWN,
          items: genderItems,
        },
        {
          name: 'degree',
          label: t('degree'),
          type: FieldTypeEnum.DROPDOWN,
          items: degreeItems,
        },
        {
          name: 'subject_name',
          label: t('project'),
          type: FieldTypeEnum.DROPDOWN,
          items: subjectItems,
        },
        {
          name: 'score_sort',
          label: t('score_sort_step'),
          type: FieldTypeEnum.DROPDOWN,
          items: scoreSortItems,
        },
      ],
    },
    exportFunction: (props: { fileType: FileType }) =>
      exportCandidatures(props.fileType, queryParams),
  }
}

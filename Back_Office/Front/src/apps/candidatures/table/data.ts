import { createElement, useCallback, useMemo } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCandidaturesStore, type StepFilters } from '@/stores/candidatures-store'
import { useSubjects } from '@/hooks/use-subjects'
import { useDegrees } from '@/hooks/use-degrees'
import { exportCandidatures } from '@/service/candidatures'
import type { FileType } from '@/models/export-model'
import { FieldTypeEnum } from '@/models/table-model'
import type { PipelineStep } from '@/apps/candidatures/pipeline'

// Stable empty fallback so memoized values below keep their reference
// across renders while a step has no saved filters.
const EMPTY_STEP_FILTERS: StepFilters = {}

export const useCandidatureToolbarProps = (opts?: {
  stepFilter?: string
}) => {
  const { t } = useTranslation()
  const { data: subjects } = useSubjects()
  const { data: degrees } = useDegrees()
  const { queryParams, setQueryParams, stepFilters, setStepFilterParams, resetStepFilterParams } =
    useCandidaturesStore()

  const activeStep = (opts?.stepFilter ?? 'all') as PipelineStep | 'all'

  const currentStepFilters = useMemo(
    () => stepFilters[activeStep] ?? EMPTY_STEP_FILTERS,
    [activeStep, stepFilters]
  )

  // NOTE: no status dropdown here on purpose. Status filtering is owned by the
  // status tabs (All / Pending / Accepted / Rejected), which filter per pipeline
  // step client-side. A server-side overall-status filter would conflict with
  // that (e.g. hiding candidates accepted in the selected step whose overall
  // status is different).
  const typeItems = useMemo(
    () => [
      { label: t('all'), value: 'all' },
      { label: t('solo'), value: 'solo' },
      { label: t('pair'), value: 'pair' },
    ],
    [t]
  )

  const genderItems = useMemo(
    () => [
      { label: t('all'), value: 'all' },
      { label: t('male'), value: 'Male' },
      { label: t('female'), value: 'Female' },
    ],
    [t]
  )

  const degreeItems = useMemo(
    () => [
      { label: t('all'), value: 'all' },
      ...(degrees ?? []).map((d) => ({
        label: d.name,
        value: d.name,
      })),
    ],
    [degrees, t]
  )

  const subjectItems = useMemo(
    () => [
      { label: t('all'), value: 'all' },
      ...(subjects ?? []).map((s) => ({
        label: s.name,
        value: s.name,
      })),
    ],
    [subjects, t]
  )

  // Direction-only dropdown: the table sorts by the CURRENT step's score
  // automatically (each step tab applies its own score column). Picking a
  // direction once covers every step.
  const scoreSortItems = useMemo(
    () => [
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
    ],
    [t]
  )

  const handleSetFilter = useCallback(
    (params: Record<string, any>) => {
      const next = { ...params }
      // Min/max come back as strings from number inputs: normalize so an
      // inverted range still filters sensibly instead of matching nothing.
      const min = next.score_min === '' || next.score_min == null ? NaN : Number(next.score_min)
      const max = next.score_max === '' || next.score_max == null ? NaN : Number(next.score_max)
      if (!Number.isNaN(min) && !Number.isNaN(max) && min > max) {
        next.score_min = String(max)
        next.score_max = String(min)
      }
      setStepFilterParams(activeStep, next)
    },
    [activeStep, setStepFilterParams]
  )

  const handleResetFilters = useCallback(() => {
    resetStepFilterParams(activeStep)
  }, [activeStep, resetStepFilterParams])

  const formDefaultValues = useMemo(() => ({
    candidature_type: currentStepFilters.candidature_type ?? '',
    gender: currentStepFilters.gender ?? '',
    degree: currentStepFilters.degree ?? '',
    subject_name: currentStepFilters.subject_name ?? '',
    score_sort: currentStepFilters.score_sort ?? '',
    score_min: currentStepFilters.score_min ?? '',
    score_max: currentStepFilters.score_max ?? '',
  }), [currentStepFilters])

  return {
    tableSearchProps: {
      placeholder: t('search_candidatures'),
      // NOTE: must stay the stable zustand action. DataTableSearch runs an
      // effect on this reference — an inline closure here would re-fire the
      // effect on every render and loop (setState -> render -> effect ...).
      setQueryParams,
    },
    tableFilterProps: {
      setQueryParams: handleSetFilter,
      resetFilterQueryParams: handleResetFilters,
      formDefaultValues,
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
        {
          name: 'score_min',
          toKey: 'score_max',
          label: t('score_range'),
          type: FieldTypeEnum.RANGE,
        },
      ],
    },
    exportFunction: (props: { fileType: FileType }) =>
      exportCandidatures(props.fileType, {
        ...queryParams,
        ...currentStepFilters,
        score_step: activeStep !== 'all' ? activeStep : '',
      }),
  }
}

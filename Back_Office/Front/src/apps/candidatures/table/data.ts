import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useCandidaturesStore } from "@/stores/candidatures-store";
import { useSubjects } from "@/hooks/use-subjects";
import { exportCandidatures } from "@/service/candidatures";
import type { FileType } from "@/models/export-model";
import { FieldTypeEnum } from "@/models/table-model";

export const useCandidatureToolbarProps = () => {
  const { t } = useTranslation();
  const { data: subjects } = useSubjects();
  const { queryParams, setQueryParams, resetFilterQueryParams } = useCandidaturesStore();

  const statusItems = [
    { label: t("candidature_status_pending"), value: "pending" },
    { label: t("candidature_status_invited"), value: "invited" },
    { label: t("candidature_status_rejected"), value: "rejected" },
  ];

  const typeItems = [
    { label: t("solo"), value: "solo" },
    { label: t("pair"), value: "pair" },
  ];

  const genderItems = [
    { label: t("male"), value: "Male" },
    { label: t("female"), value: "Female" },
  ];

  const subjectItems = useMemo(
    () =>
      (subjects ?? []).map((s) => ({
        label: s.name,
        value: s.name,
      })),
    [subjects],
  );

  return {
    tableSearchProps: {
      placeholder: t("search_candidatures"),
      setQueryParams,
    },
    tableFilterProps: {
      setQueryParams,
      resetFilterQueryParams,
      formDefaultValues: {
        status: "",
        candidature_type: "",
        gender: "",
        subject_name: "",
      },
      formFields: [
        {
          name: "status",
          label: t("status"),
          type: FieldTypeEnum.DROPDOWN,
          items: statusItems,
        },
        {
          name: "candidature_type",
          label: t("type"),
          type: FieldTypeEnum.DROPDOWN,
          items: typeItems,
        },
        {
          name: "gender",
          label: t("candidature_filter_gender"),
          type: FieldTypeEnum.DROPDOWN,
          items: genderItems,
        },
        {
          name: "subject_name",
          label: t("project"),
          type: FieldTypeEnum.DROPDOWN,
          items: subjectItems,
        },
      ],
    },
    exportFunction: (props: { fileType: FileType }) =>
      exportCandidatures(props.fileType, queryParams),
  };
};

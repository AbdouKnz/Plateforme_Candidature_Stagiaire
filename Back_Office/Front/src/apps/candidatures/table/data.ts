import { IconFileDescription } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { DialogEnum } from "@/models/alert-model";
import { usePermissions } from "@/hooks/use-permissions";
import { useCandidaturesStore } from "@/stores/candidatures-store";
import { exportCandidatures } from "@/service/candidatures";
import type { FileType } from "@/models/export-model";

export const useCandidatureToolbarProps = () => {
  const { t } = useTranslation();
  const { queryParams, setQueryParams } = useCandidaturesStore();

  return {
    tableSearchProps: {
      placeholder: t("search_candidatures"),
      setQueryParams,
    },
    exportFunction: (props: { fileType: FileType }) =>
      exportCandidatures(props.fileType, queryParams),
  };
};

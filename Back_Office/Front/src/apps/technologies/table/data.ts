import { IconCpu } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { DialogEnum } from "@/models/alert-model";
import { usePermissions } from "@/hooks/use-permissions";
import { useTechnologiesStore } from "@/stores/technologies-store";

export const useTechnologyToolbarProps = () => {
  const { t } = useTranslation();
  const { setOpenTechnology, setQueryParams } = useTechnologiesStore();
  const { modulePermissions } = usePermissions();

  const canCreateTechnology = modulePermissions.technologies?.canCreate;

  return {
    tableSearchProps: {
      placeholder: t("search_technologies"),
      setQueryParams,
    },
    tableAddProps: canCreateTechnology
      ? {
          addButtonLabel: t("add_technology"),
          addButtonIcon: IconCpu,
          addFunction: () => setOpenTechnology(DialogEnum.ADD),
        }
      : undefined,
  };
};

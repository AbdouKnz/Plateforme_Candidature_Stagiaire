import { IconClock } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { DialogEnum } from "@/models/alert-model";
import { usePermissions } from "@/hooks/use-permissions";
import { useDurationsStore } from "@/stores/durations-store";

export const useDurationToolbarProps = () => {
  const { t } = useTranslation();
  const { setOpenDuration, setQueryParams } = useDurationsStore();
  const { modulePermissions } = usePermissions();

  const canCreateDuration = modulePermissions.durations?.canCreate;

  return {
    tableSearchProps: {
      placeholder: t("search_durations"),
      setQueryParams,
    },
    tableAddProps: canCreateDuration
      ? {
          addButtonLabel: t("add_duration"),
          addButtonIcon: IconClock,
          addFunction: () => setOpenDuration(DialogEnum.ADD),
        }
      : undefined,
  };
};

import { IconIdBadge } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { DialogEnum } from "@/models/alert-model";
import { usePermissions } from "@/hooks/use-permissions";
import { useProfilesStore } from "@/stores/profiles-store";

export const useProfileToolbarProps = () => {
  const { t } = useTranslation();
  const { setOpenProfile, setQueryParams } = useProfilesStore();
  const { modulePermissions } = usePermissions();

  const canCreateProfile = modulePermissions.profiles?.canCreate;

  return {
    tableSearchProps: {
      placeholder: t("search_profiles"),
      setQueryParams,
    },
    tableAddProps: canCreateProfile
      ? {
          addButtonLabel: t("add_profile"),
          addButtonIcon: IconIdBadge,
          addFunction: () => setOpenProfile(DialogEnum.ADD),
        }
      : undefined,
  };
};

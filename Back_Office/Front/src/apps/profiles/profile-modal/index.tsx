"use client";

import { ProfilesActionModal } from "./profiles-action-modal";
import { useDeleteProfile, useProfile, useUpdateProfile } from "@/hooks/use-profiles";
import { DialogEnum } from "@/models/alert-model";
import { useProfilesStore } from "@/stores/profiles-store";
import { StatusAlert } from "@/components/shared/alert/status-alert";
import { useTranslation } from "react-i18next";

export function ProfilesModals() {
  const { t } = useTranslation();
  const { openProfile, setOpenProfile, currentProfileId, setCurrentProfileId } = useProfilesStore();
  const { data: profile, isLoading, isError, error } = useProfile(currentProfileId);

  const deleteProfileMutation = useDeleteProfile();
  const updateStatusMutation = useUpdateProfile();

  const isBlocked = profile?.status;
  const statusAction = isBlocked ? t("deactivate") : t("activate");

  const handleCloseModal = () => {
    setOpenProfile(null);
    setCurrentProfileId(null);
  };

  const handleDelete = () => {
    if (!profile) return;
    deleteProfileMutation.mutate(profile.id, {
      onSuccess: () => {
        handleCloseModal();
      },
    });
  };

  const handleUpdateStatus = () => {
    if (!profile) return;
    updateStatusMutation.mutate(
      {
        id: profile.id,
        data: { status: !profile.status },
      },
      {
        onSuccess: () => {
          handleCloseModal();
        },
      }
    );
  };

  return (
    <>
      <ProfilesActionModal
        open={openProfile === DialogEnum.ADD}
        onClose={() => handleCloseModal()}
        mode={DialogEnum.ADD}
      />

      {profile && (
        <>
          <ProfilesActionModal
            open={openProfile === DialogEnum.VIEW || openProfile === DialogEnum.EDIT}
            onClose={() => handleCloseModal()}
            switchToEdit={() => setOpenProfile(DialogEnum.EDIT)}
            mode={openProfile as DialogEnum.VIEW | DialogEnum.EDIT}
            profile={profile}
          />

          <ProfilesActionModal
            open={openProfile === DialogEnum.DELETE}
            onClose={handleCloseModal}
            mode={DialogEnum.DELETE}
            profile={profile}
            onConfirm={handleDelete}
            isDeleting={deleteProfileMutation.isPending}
          />

          <StatusAlert
            isBlocked={!!isBlocked}
            open={openProfile === DialogEnum.BLOCK}
            onClose={handleCloseModal}
            isLoading={updateStatusMutation.isPending}
            onConfirm={handleUpdateStatus}
            title={t("confirm_profile_status_change", { action: statusAction })}
            blockLoadingText={t("disabling")}
            unblockLoadingText={t("enabling")}
            unblockButtonText={t("activate")}
            blockButtonText={t("deactivate")}
          />
        </>
      )}
    </>
  );
}

"use client";

import { DurationsActionModal } from "./durations-action-modal";
import { useDeleteDuration, useDuration, useUpdateDuration } from "@/hooks/use-durations";
import { DialogEnum } from "@/models/alert-model";
import { useDurationsStore } from "@/stores/durations-store";
import { StatusAlert } from "@/components/shared/alert/status-alert";
import { useTranslation } from "react-i18next";

export function DurationsModals() {
  const { t } = useTranslation();
  const { openDuration, setOpenDuration, currentDurationId, setCurrentDurationId } = useDurationsStore();
  const { data: duration, isLoading, isError, error } = useDuration(currentDurationId);

  const deleteDurationMutation = useDeleteDuration();
  const updateStatusMutation = useUpdateDuration();

  const isBlocked = duration?.status;
  const statusAction = isBlocked ? t("deactivate") : t("activate");

  const handleCloseModal = () => {
    setOpenDuration(null);
    setCurrentDurationId(null);
  };

  const handleDelete = () => {
    if (!duration) return;
    deleteDurationMutation.mutate(duration.id, {
      onSuccess: () => {
        handleCloseModal();
      },
    });
  };

  const handleUpdateStatus = () => {
    if (!duration) return;
    updateStatusMutation.mutate(
      {
        id: duration.id,
        data: { status: !duration.status },
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
      <DurationsActionModal
        open={openDuration === DialogEnum.ADD}
        onClose={() => handleCloseModal()}
        mode={DialogEnum.ADD}
      />

      {duration && (
        <>
          <DurationsActionModal
            open={openDuration === DialogEnum.VIEW || openDuration === DialogEnum.EDIT}
            onClose={() => handleCloseModal()}
            switchToEdit={() => setOpenDuration(DialogEnum.EDIT)}
            mode={openDuration as DialogEnum.VIEW | DialogEnum.EDIT}
            duration={duration}
          />

          <DurationsActionModal
            open={openDuration === DialogEnum.DELETE}
            onClose={handleCloseModal}
            mode={DialogEnum.DELETE}
            duration={duration}
            onConfirm={handleDelete}
            isDeleting={deleteDurationMutation.isPending}
          />

          <StatusAlert
            isBlocked={!!isBlocked}
            open={openDuration === DialogEnum.BLOCK}
            onClose={handleCloseModal}
            isLoading={updateStatusMutation.isPending}
            onConfirm={handleUpdateStatus}
            title={t("confirm_duration_status_change", { action: statusAction })}
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

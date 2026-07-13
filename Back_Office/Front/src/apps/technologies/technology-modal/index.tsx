"use client";

import { TechnologiesActionModal } from "./technologies-action-modal";
import { useDeleteTechnology, useTechnology, useUpdateTechnology } from "@/hooks/use-technologies";
import { DialogEnum } from "@/models/alert-model";
import { useTechnologiesStore } from "@/stores/technologies-store";
import { StatusAlert } from "@/components/shared/alert/status-alert";
import { useTranslation } from "react-i18next";

export function TechnologiesModals() {
  const { t } = useTranslation();
  const { openTechnology, setOpenTechnology, currentTechnologyId, setCurrentTechnologyId } = useTechnologiesStore();
  const { data: technology, isLoading, isError, error } = useTechnology(currentTechnologyId);

  const deleteTechnologyMutation = useDeleteTechnology();
  const updateStatusMutation = useUpdateTechnology();

  const isBlocked = technology?.status;
  const statusAction = isBlocked ? t("deactivate") : t("activate");

  const handleCloseModal = () => {
    setOpenTechnology(null);
    setCurrentTechnologyId(null);
  };

  const handleDelete = () => {
    if (!technology) return;
    deleteTechnologyMutation.mutate(technology.id, {
      onSuccess: () => {
        handleCloseModal();
      },
    });
  };

  const handleUpdateStatus = () => {
    if (!technology) return;
    updateStatusMutation.mutate(
      {
        id: technology.id,
        data: { status: !technology.status },
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
      <TechnologiesActionModal
        open={openTechnology === DialogEnum.ADD}
        onClose={() => handleCloseModal()}
        mode={DialogEnum.ADD}
      />

      {technology && (
        <>
          <TechnologiesActionModal
            open={openTechnology === DialogEnum.VIEW || openTechnology === DialogEnum.EDIT}
            onClose={() => handleCloseModal()}
            switchToEdit={() => setOpenTechnology(DialogEnum.EDIT)}
            mode={openTechnology as DialogEnum.VIEW | DialogEnum.EDIT}
            technology={technology}
          />

          <TechnologiesActionModal
            open={openTechnology === DialogEnum.DELETE}
            onClose={handleCloseModal}
            mode={DialogEnum.DELETE}
            technology={technology}
            onConfirm={handleDelete}
            isDeleting={deleteTechnologyMutation.isPending}
          />

          <StatusAlert
            isBlocked={!!isBlocked}
            open={openTechnology === DialogEnum.BLOCK}
            onClose={handleCloseModal}
            isLoading={updateStatusMutation.isPending}
            onConfirm={handleUpdateStatus}
            title={t("confirm_technology_status_change", { action: statusAction })}
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

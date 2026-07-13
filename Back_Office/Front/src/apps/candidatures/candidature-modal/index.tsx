"use client";

import { CandidatureActionModal } from "./candidatures-action-modal";
import { SendEmailModal } from "./send-email-modal";
import { useDeleteCandidature } from "@/hooks/use-candidatures";
import { useCandidature } from "@/hooks/use-candidatures";
import { DialogEnum } from "@/models/alert-model";
import { useCandidaturesStore } from "@/stores/candidatures-store";

export function CandidatureModals() {
  const { openCandidature, setOpenCandidature, currentCandidatureId, setCurrentCandidatureId, emailModalData, setEmailModalData } = useCandidaturesStore();
  const { data: candidature } = useCandidature(currentCandidatureId);
  const { data: emailCandidature } = useCandidature(emailModalData?.candidatureId ?? null);

  const deleteMutation = useDeleteCandidature();

  const handleCloseModal = () => {
    setOpenCandidature(null);
    setCurrentCandidatureId(null);
  };

  const handleDelete = () => {
    if (!candidature) return;
    deleteMutation.mutate(candidature.id, {
      onSuccess: () => {
        handleCloseModal();
      },
    });
  };

  return (
    <>
      <CandidatureActionModal
        open={openCandidature === DialogEnum.VIEW}
        onClose={() => handleCloseModal()}
        mode={DialogEnum.VIEW}
        candidature={candidature}
      />
      <CandidatureActionModal
        open={openCandidature === DialogEnum.DELETE}
        onClose={() => handleCloseModal()}
        mode={DialogEnum.DELETE}
        candidature={candidature}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
      />
      {emailModalData && emailCandidature && (
        <SendEmailModal
          open
          onClose={() => {
            setEmailModalData(null);
          }}
          candidature={emailCandidature}
          templateType={emailModalData.templateType}
        />
      )}
    </>
  );
}

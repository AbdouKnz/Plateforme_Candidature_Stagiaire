import { AuditModal } from "./audit-modal";
import { useAudit } from "@/hooks/use-audit";
import { DialogEnum } from "@/models/alert-model";
import { useAuditStore } from "@/stores/audit-store";

export function AuditsModals() {
  const { openAudit, setOpenAudit, currentAuditId, setCurrentAuditId } =
    useAuditStore();
  const { data: audit, isLoading, isError, error } = useAudit(currentAuditId);

  const handleCloseModal = () => {
    setOpenAudit(null);
    setCurrentAuditId(null);
  };

  return (
    <>
      {audit && (
        <AuditModal
          open={openAudit === DialogEnum.COMPARE}
          onOpenChange={() => handleCloseModal()}
          audit={audit}
        />
      )}
    </>
  );
}

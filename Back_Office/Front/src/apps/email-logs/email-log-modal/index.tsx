import { EmailLogModal } from "./email-log-modal";
import { useEmailLog } from "@/hooks/use-email-logs";
import { DialogEnum } from "@/models/alert-model";
import { useEmailLogsStore } from "@/stores/email-logs-store";

export function EmailLogsModals() {
  const { openEmailLog, setOpenEmailLog, currentEmailLogId, setCurrentEmailLogId } =
    useEmailLogsStore();
  const { data: emailLog, isLoading, isError, error } = useEmailLog(currentEmailLogId);

  const handleCloseModal = () => {
    setOpenEmailLog(null);
    setCurrentEmailLogId(null);
  };

  return (
    <>
      {emailLog && (
        <EmailLogModal
          open={openEmailLog === DialogEnum.VIEW}
          onOpenChange={() => handleCloseModal()}
          emailLog={emailLog}
        />
      )}
    </>
  );
}
import { useQuery, useMutation, type UseQueryOptions } from "@tanstack/react-query";
import { Audit, AuditQueryParams, AuditResponse } from "@/models/audit-model";
import { AxiosError } from "axios";
import { AlertEnum } from "@/models/alert-model";
import { FileType } from "@/models/export-model";
import { ID } from "@/models/api";
import { exportAudits, getAuditById, getAudits } from "@/service/audit";
import { useAlertStore } from "@/stores/alert-store";


export function useAudits(params?: AuditQueryParams) {
  return useQuery<AuditResponse, Error>({
    queryKey: ["audits", params],
    queryFn: () => getAudits(params),
    retry: 1,
    onError: (error: Error) => {
      console.error("Error fetching audits:", error);
    },
  } as UseQueryOptions<AuditResponse, Error>);
}


export function useAudit(id: ID) {
  const { showAlert } = useAlertStore();

  return useQuery<Audit, AxiosError>({
    queryKey: ["audit", id],
    queryFn: () => getAuditById(id!),
    enabled: !!id,
    retry: 1,
    onError: (error: any) => {
      console.error(`Error fetching audit:`, error.message);
      showAlert({
        message: error?.response?.data?.error || "Failed to fetch audit",
        type: AlertEnum.ERROR,
      });
    },
  } as UseQueryOptions<Audit, AxiosError>);
}


export function useExportAudits() {
  const { showAlert } = useAlertStore();

  return useMutation<void, Error, { fileType: FileType; params?: AuditQueryParams }>({
    mutationFn: ({ fileType, params }) => exportAudits(fileType, params),
    onSuccess: () => {
      showAlert({
        message: "Audits exported successfully!",
        type: AlertEnum.SUCCESS,
      });
    },
    onError: (error: any) => {
      console.error("Error exporting audits:", error);
      showAlert({
        message:
          error?.response?.data?.message || "An error occurred while exporting audits!",
        type: AlertEnum.ERROR,
      });
    },
  });
}
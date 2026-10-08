import {
  useQuery,
} from "@tanstack/react-query";
import {
  getEmailLogs,
  getEmailLogById,
} from "@/service/email-logs";
import type { EmailLog, EmailLogQueryParams, EmailLogListResponse } from "@/models/email-log-model";
import type { AxiosError } from "axios";

export function useEmailLogs(params: EmailLogQueryParams) {
  return useQuery<EmailLogListResponse, Error>({
    queryKey: ["email-logs", params],
    queryFn: () => getEmailLogs(params),
    retry: 1,
  });
}

export function useEmailLog(id: number | undefined | null) {
  return useQuery<EmailLog, AxiosError>({
    queryKey: ["email-log", id],
    queryFn: () => getEmailLogById(id!),
    enabled: !!id,
    retry: 1,
  });
}
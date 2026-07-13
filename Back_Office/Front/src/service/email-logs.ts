import { createDownloadLink } from "@/lib/utils";
import axiosApi from "@/lib/axios";
import type { EmailLog, EmailLogQueryParams, EmailLogListResponse } from "@/models/email-log-model";
import type { FileType } from "@/models/export-model";

const EMAIL_LOG_ENDPOINT = `/email-logs`;

export const getEmailLogs = async (params?: EmailLogQueryParams): Promise<EmailLogListResponse> => {
  const response = await axiosApi.get(EMAIL_LOG_ENDPOINT + "/", { params });
  return response?.data;
};

export const getEmailLogById = async (id: number): Promise<EmailLog> => {
  const response = await axiosApi.get(`${EMAIL_LOG_ENDPOINT}/${id}`);
  return response?.data?.data;
};

export const exportEmailLogs = async (fileType: FileType, params?: EmailLogQueryParams): Promise<void> => {
  const queryParams = new URLSearchParams(params as Record<string, string>).toString();
  const url = `${EMAIL_LOG_ENDPOINT}/export?file_type=${fileType}${queryParams ? `&${queryParams}` : ""}`;
  const response = await axiosApi.post(url, null, { responseType: "blob" });
  const contentDisposition = response.headers["content-disposition"];
  const filename = contentDisposition
    ? contentDisposition.split("filename=")[1].replace(/"/g, "")
    : `email_logs.${fileType === "pdf" ? "pdf" : "xlsx"}`;
  createDownloadLink(new Blob([response.data]), filename);
};
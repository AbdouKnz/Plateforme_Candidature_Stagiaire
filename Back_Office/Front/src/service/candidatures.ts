import axiosApi from "@/lib/axios";
import { createDownloadLink } from "@/lib/utils";
import { Candidature, CandidatureResponse, CandidatureQueryParams, RejectionReason } from "@/models/candidature-model";
import type { FileType } from "@/models/export-model";

const CANDIDATURE_ENDPOINT = `/candidatures`;

// The filter UI collects score sort as a single combined value "step:direction".
// Translate it into the two query params the backend expects.
const toBackendSort = (params?: CandidatureQueryParams): CandidatureQueryParams | undefined => {
  if (!params) return params;
  const result = { ...params };
  if (result.score_sort && result.score_sort.includes(":")) {
    const [score_sort_step, score_sort_direction] = result.score_sort.split(":");
    delete result.score_sort;
    result.score_sort_step = score_sort_step;
    result.score_sort_direction = score_sort_direction;
  }
  return result;
};

export const getRecentCandidatures = async (): Promise<Candidature[]> => {
  const response = await axiosApi.get(CANDIDATURE_ENDPOINT + "/recent");
  return response?.data?.data;
};

export type PipelineCounts = { pending: number; accepted: number; rejected: number };
export type PipelineStage = { id: string; index: string; name: string; short: string; final?: boolean; counts: PipelineCounts };
export const getPipeline = async (): Promise<PipelineStage[]> => {
  const response = await axiosApi.get(CANDIDATURE_ENDPOINT + "/pipeline");
  return response?.data?.data;
};

export const getCandidatures = async (params?: CandidatureQueryParams): Promise<Candidature[]> => {
  const response = await axiosApi.get(CANDIDATURE_ENDPOINT + "/", { params: toBackendSort(params) });
  return response?.data?.data;
};

export const getCandidatureById = async (id: number): Promise<Candidature> => {
  const response = await axiosApi.get(`${CANDIDATURE_ENDPOINT}/${id}`);
  return response?.data?.data;
};

export const createCandidature = async (data: Partial<Candidature>): Promise<CandidatureResponse> => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof File || value instanceof Blob) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    }
  });
  const response = await axiosApi.post(CANDIDATURE_ENDPOINT + "/", formData);
  return response?.data;
};

export const updateCandidature = async (id: number, data: Partial<Candidature>): Promise<CandidatureResponse> => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof File || value instanceof Blob) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    }
  });
  const response = await axiosApi.put(`${CANDIDATURE_ENDPOINT}/${id}`, formData);
  return response?.data;
};

export const deleteCandidature = async (id: number): Promise<CandidatureResponse> => {
  const response = await axiosApi.delete(`${CANDIDATURE_ENDPOINT}/${id}`);
  return response?.data;
};

export const sendEmail = async (
  id: number,
  data: { type: string; step?: string; interview_date?: string; interview_time?: string; rejection_reason?: string; quiz_link?: string; quiz_link2?: string; meeting_link?: string; f2f_meeting_link?: string; start_date?: string; body?: string; body2?: string; bcc?: string }
): Promise<CandidatureResponse> => {
  const response = await axiosApi.post(`${CANDIDATURE_ENDPOINT}/${id}/send-email`, data);
  return response?.data;
};

export const getEmailPreview = async (
  id: number,
  type: string,
  step?: string,
  interviewDate?: string,
  interviewTime?: string,
  rejectionReason?: string,
  quizLink?: string,
  meetingLink?: string,
  f2fLink?: string,
  startDate?: string,
  quizLink2?: string
): Promise<{ to: string; subject: string; body: string; to2?: string; body2?: string }> => {
  const response = await axiosApi.get(`${CANDIDATURE_ENDPOINT}/${id}/email-preview`, {
    params: { type, step, interview_date: interviewDate, interview_time: interviewTime, rejection_reason: rejectionReason, quiz_link: quizLink, quiz_link2: quizLink2, meeting_link: meetingLink, f2f_meeting_link: f2fLink, start_date: startDate },
  });
  return response?.data?.data;
};

export const getRejectionReasons = async (): Promise<Record<string, RejectionReason[]>> => {
  const response = await axiosApi.get(CANDIDATURE_ENDPOINT + "/rejection-reasons");
  return response?.data?.data;
};

export const bulkRejectEmails = async (ids: number[], rejectionReason: string, bcc?: string): Promise<{ sent: number }> => {
  const response = await axiosApi.post(`${CANDIDATURE_ENDPOINT}/bulk-reject`, { ids, rejection_reason: rejectionReason, bcc });
  return response?.data?.data;
};

export interface BulkAcceptPayload {
  ids: number[];
  type: string;
  step?: string;
  quiz_link?: string;
  quiz_link2?: string;
  meeting_link?: string;
  f2f_meeting_link?: string;
  interview_date?: string;
  interview_time?: string;
  start_date?: string;
  body?: string;
  bcc?: string;
}

export const bulkAcceptEmails = async (payload: BulkAcceptPayload): Promise<{ sent: number }> => {
  const response = await axiosApi.post(`${CANDIDATURE_ENDPOINT}/bulk-accept`, payload);
  return response?.data?.data;
};

export const exportCandidatures = async (fileType: FileType, params?: CandidatureQueryParams): Promise<void> => {
  const queryParams = new URLSearchParams(toBackendSort(params) as Record<string, string>).toString();
  const url = `${CANDIDATURE_ENDPOINT}/export?file_type=${fileType}${queryParams ? `&${queryParams}` : ""}`;
  const response = await axiosApi.post(url, null, { responseType: "blob" });
  const contentDisposition = response.headers["content-disposition"];
  const filename = contentDisposition
    ? contentDisposition.split("filename=")[1].replace(/"/g, "")
    : `candidatures.${fileType === "pdf" ? "pdf" : "xlsx"}`;
  createDownloadLink(new Blob([response.data]), filename);
};

export interface PrepareResetResult {
  blob: Blob;
  filename: string;
}

export const verifyResetPassword = async (password: string): Promise<void> => {
  await axiosApi.post(`${CANDIDATURE_ENDPOINT}/reset/verify`, { password });
};

export const prepareSessionReset = async (password: string): Promise<PrepareResetResult> => {
  const response = await axiosApi.post(
    `${CANDIDATURE_ENDPOINT}/reset/prepare`,
    { password },
    { responseType: "blob" }
  );
  const contentDisposition = response.headers["content-disposition"];
  const filename = contentDisposition
    ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
    : `session_backup_${new Date().toISOString().slice(0, 10)}.xlsx`;
  return {
    blob: new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename: filename || "session_backup.xlsx",
  };
};

export const confirmSessionReset = async (password: string): Promise<{ status: number; message: string }> => {
  const response = await axiosApi.post(`${CANDIDATURE_ENDPOINT}/reset/confirm`, { password });
  return response?.data;
};


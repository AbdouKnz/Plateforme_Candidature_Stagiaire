import axiosApi from "@/lib/axios";
import { createDownloadLink } from "@/lib/utils";
import { Candidature, CandidatureResponse, CandidatureQueryParams, RejectionReason } from "@/models/candidature-model";
import type { FileType } from "@/models/export-model";

const CANDIDATURE_ENDPOINT = `/candidatures`;

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
  const response = await axiosApi.get(CANDIDATURE_ENDPOINT + "/", { params });
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
  data: { type: string; step?: string; interview_date?: string; interview_time?: string; rejection_reason?: string; quiz_link?: string; meeting_link?: string; start_date?: string }
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
  startDate?: string
): Promise<{ to: string; subject: string; body: string }> => {
  const response = await axiosApi.get(`${CANDIDATURE_ENDPOINT}/${id}/email-preview`, {
    params: { type, step, interview_date: interviewDate, interview_time: interviewTime, rejection_reason: rejectionReason, quiz_link: quizLink, meeting_link: meetingLink, start_date: startDate },
  });
  return response?.data?.data;
};

export const getRejectionReasons = async (): Promise<Record<string, RejectionReason[]>> => {
  const response = await axiosApi.get(CANDIDATURE_ENDPOINT + "/rejection-reasons");
  return response?.data?.data;
};

export const exportCandidatures = async (fileType: FileType, params?: CandidatureQueryParams): Promise<void> => {
  const queryParams = new URLSearchParams(params as Record<string, string>).toString();
  const url = `${CANDIDATURE_ENDPOINT}/export?file_type=${fileType}${queryParams ? `&${queryParams}` : ""}`;
  const response = await axiosApi.post(url, null, { responseType: "blob" });
  const contentDisposition = response.headers["content-disposition"];
  const filename = contentDisposition
    ? contentDisposition.split("filename=")[1].replace(/"/g, "")
    : `candidatures.${fileType === "pdf" ? "pdf" : "xlsx"}`;
  createDownloadLink(new Blob([response.data]), filename);
};

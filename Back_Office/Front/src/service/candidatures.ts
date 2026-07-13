import axiosApi from "@/lib/axios";
import { createDownloadLink } from "@/lib/utils";
import { Candidature, CandidatureResponse, CandidatureQueryParams } from "@/models/candidature-model";
import type { FileType } from "@/models/export-model";

const CANDIDATURE_ENDPOINT = `/candidatures`;

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

export const sendEmail = async (id: number, data: { type: string }): Promise<CandidatureResponse> => {
  const response = await axiosApi.post(`${CANDIDATURE_ENDPOINT}/${id}/send-email`, data);
  return response?.data;
};

export const getEmailPreview = async (id: number, type: string, interviewDate?: string, interviewTime?: string): Promise<{ to: string; subject: string; body: string }> => {
  const response = await axiosApi.get(`${CANDIDATURE_ENDPOINT}/${id}/email-preview`, { params: { type, interview_date: interviewDate, interview_time: interviewTime } });
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

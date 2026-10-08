import axiosApi from "@/lib/axios";
import { createDownloadLink } from "@/lib/utils";
import type { Subject, SubjectResponse, SubjectQueryParams } from "@/models/subject-model";
import type { FileType } from "@/models/export-model";

const SUBJECT_ENDPOINT = `/subjects`;

export const getSubjects = async (params?: SubjectQueryParams): Promise<Subject[]> => {
  const response = await axiosApi.get(SUBJECT_ENDPOINT + "/", { params });
  return response?.data?.data;
};

export const getSubjectById = async (id: number): Promise<Subject> => {
  const response = await axiosApi.get(`${SUBJECT_ENDPOINT}/${id}`);
  return response?.data?.data;
};

function toSubjectFormData(subjectData: Partial<Subject> & { image?: File | null }): FormData {
  const formData = new FormData();
  Object.entries(subjectData).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === "image") return;
    if (Array.isArray(value)) {
      formData.append(key, (value as unknown[]).join(","));
    } else if (typeof value === "boolean") {
      formData.append(key, value ? "true" : "false");
    } else {
      formData.append(key, String(value));
    }
  });
  if (subjectData.image instanceof File) {
    formData.append("image", subjectData.image);
  }
  return formData;
}

export const createSubject = async (subjectData: Partial<Subject> & { image?: File | null }): Promise<SubjectResponse> => {
  if (subjectData.image instanceof File) {
    const response = await axiosApi.post(SUBJECT_ENDPOINT + "/", toSubjectFormData(subjectData), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response?.data;
  }
  const response = await axiosApi.post(SUBJECT_ENDPOINT + "/", subjectData);
  return response?.data;
};

export const updateSubject = async (subjectId: number, subjectData: Partial<Subject> & { image?: File | null }): Promise<SubjectResponse> => {
  if (subjectData.image instanceof File) {
    const response = await axiosApi.put(`${SUBJECT_ENDPOINT}/${subjectId}`, toSubjectFormData(subjectData), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response?.data;
  }
  const response = await axiosApi.put(`${SUBJECT_ENDPOINT}/${subjectId}`, subjectData);
  return response?.data;
};

export const deleteSubject = async (subjectId: number): Promise<SubjectResponse> => {
  const response = await axiosApi.delete(`${SUBJECT_ENDPOINT}/${subjectId}`);
  return response?.data;
};

export const exportSubjects = async (fileType: FileType, params?: SubjectQueryParams): Promise<void> => {
  const queryParams = new URLSearchParams(params as Record<string, string>).toString();
  const url = `${SUBJECT_ENDPOINT}/export?file_type=${fileType}${queryParams ? `&${queryParams}` : ""}`;
  const response = await axiosApi.post(url, null, { responseType: "blob" });
  const contentDisposition = response.headers["content-disposition"];
  const filename = contentDisposition
    ? contentDisposition.split("filename=")[1].replace(/"/g, "")
    : `subjects.${fileType === "pdf" ? "pdf" : "xlsx"}`;
  createDownloadLink(new Blob([response.data]), filename);
};

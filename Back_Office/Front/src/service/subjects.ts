import axiosApi from "@/lib/axios";
import { Subject, SubjectResponse, SubjectQueryParams } from "@/models/subject-model";

const SUBJECT_ENDPOINT = `/subjects`;

export const getSubjects = async (params?: SubjectQueryParams): Promise<Subject[]> => {
  const response = await axiosApi.get(SUBJECT_ENDPOINT + "/", { params });
  return response?.data?.data;
};

export const getSubjectById = async (id: number): Promise<Subject> => {
  const response = await axiosApi.get(`${SUBJECT_ENDPOINT}/${id}`);
  return response?.data?.data;
};

export const createSubject = async (subjectData: Partial<Subject>): Promise<SubjectResponse> => {
  const response = await axiosApi.post(SUBJECT_ENDPOINT + "/", subjectData);
  return response?.data;
};

export const updateSubject = async (subjectId: number, subjectData: Partial<Subject>): Promise<SubjectResponse> => {
  const response = await axiosApi.put(`${SUBJECT_ENDPOINT}/${subjectId}`, subjectData);
  return response?.data;
};

export const deleteSubject = async (subjectId: number): Promise<SubjectResponse> => {
  const response = await axiosApi.delete(`${SUBJECT_ENDPOINT}/${subjectId}`);
  return response?.data;
};

import axiosApi from "@/lib/axios";
import { Degree, DegreeResponse, DegreeQueryParams } from "@/models/degree-model";

const DEGREE_ENDPOINT = `/degrees`;

export const getDegrees = async (params?: DegreeQueryParams): Promise<Degree[]> => {
  const response = await axiosApi.get(DEGREE_ENDPOINT + "/", { params });
  return response?.data?.data;
};

export const getDegreeById = async (id: number): Promise<Degree> => {
  const response = await axiosApi.get(`${DEGREE_ENDPOINT}/${id}`);
  return response?.data?.data;
};

export const createDegree = async (degreeData: Partial<Degree>): Promise<DegreeResponse> => {
  const response = await axiosApi.post(DEGREE_ENDPOINT + "/", degreeData);
  return response?.data;
};

export const updateDegree = async (degreeId: number, degreeData: Partial<Degree>): Promise<DegreeResponse> => {
  const response = await axiosApi.put(`${DEGREE_ENDPOINT}/${degreeId}`, degreeData);
  return response?.data;
};

export const deleteDegree = async (degreeId: number): Promise<DegreeResponse> => {
  const response = await axiosApi.delete(`${DEGREE_ENDPOINT}/${degreeId}`);
  return response?.data;
};

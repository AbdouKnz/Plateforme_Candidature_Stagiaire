import axiosApi from "@/lib/axios";
import { Technology, TechnologyResponse, TechnologyQueryParams } from "@/models/technology-model";

const TECHNOLOGY_ENDPOINT = `/technologies`;

export const getTechnologies = async (params?: TechnologyQueryParams): Promise<Technology[]> => {
  const response = await axiosApi.get(TECHNOLOGY_ENDPOINT + "/", { params });
  return response?.data?.data;
};

export const getTechnologyById = async (id: number): Promise<Technology> => {
  const response = await axiosApi.get(`${TECHNOLOGY_ENDPOINT}/${id}`);
  return response?.data?.data;
};

export const createTechnology = async (technologyData: Partial<Technology>): Promise<TechnologyResponse> => {
  const response = await axiosApi.post(TECHNOLOGY_ENDPOINT + "/", technologyData);
  return response?.data;
};

export const updateTechnology = async (technologyId: number, technologyData: Partial<Technology>): Promise<TechnologyResponse> => {
  const response = await axiosApi.put(`${TECHNOLOGY_ENDPOINT}/${technologyId}`, technologyData);
  return response?.data;
};

export const deleteTechnology = async (technologyId: number): Promise<TechnologyResponse> => {
  const response = await axiosApi.delete(`${TECHNOLOGY_ENDPOINT}/${technologyId}`);
  return response?.data;
};

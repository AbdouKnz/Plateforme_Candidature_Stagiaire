import axiosApi from "@/lib/axios";
import { Type, TypeResponse, TypeQueryParams } from "@/models/type-model";

const TYPE_ENDPOINT = `/types`;

export const getTypes = async (params?: TypeQueryParams): Promise<Type[]> => {
  const response = await axiosApi.get(TYPE_ENDPOINT + "/", { params });
  return response?.data?.data;
};

export const getTypeById = async (id: number): Promise<Type> => {
  const response = await axiosApi.get(`${TYPE_ENDPOINT}/${id}`);
  return response?.data?.data;
};

export const createType = async (typeData: Partial<Type>): Promise<TypeResponse> => {
  const response = await axiosApi.post(TYPE_ENDPOINT + "/", typeData);
  return response?.data;
};

export const updateType = async (typeId: number, typeData: Partial<Type>): Promise<TypeResponse> => {
  const response = await axiosApi.put(`${TYPE_ENDPOINT}/${typeId}`, typeData);
  return response?.data;
};

export const deleteType = async (typeId: number): Promise<TypeResponse> => {
  const response = await axiosApi.delete(`${TYPE_ENDPOINT}/${typeId}`);
  return response?.data;
};

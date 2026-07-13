import axiosApi from "@/lib/axios";
import { Duration, DurationResponse, DurationQueryParams } from "@/models/duration-model";

const DURATION_ENDPOINT = `/durations`;

export const getDurations = async (params?: DurationQueryParams): Promise<Duration[]> => {
  const response = await axiosApi.get(DURATION_ENDPOINT + "/", { params });
  return response?.data?.data;
};

export const getDurationById = async (id: number): Promise<Duration> => {
  const response = await axiosApi.get(`${DURATION_ENDPOINT}/${id}`);
  return response?.data?.data;
};

export const createDuration = async (durationData: Partial<Duration>): Promise<DurationResponse> => {
  const response = await axiosApi.post(DURATION_ENDPOINT + "/", durationData);
  return response?.data;
};

export const updateDuration = async (durationId: number, durationData: Partial<Duration>): Promise<DurationResponse> => {
  const response = await axiosApi.put(`${DURATION_ENDPOINT}/${durationId}`, durationData);
  return response?.data;
};

export const deleteDuration = async (durationId: number): Promise<DurationResponse> => {
  const response = await axiosApi.delete(`${DURATION_ENDPOINT}/${durationId}`);
  return response?.data;
};

import axiosApi from "@/lib/axios";
import { Profile, ProfileResponse, ProfileQueryParams } from "@/models/profile-model";

const PROFILE_ENDPOINT = `/profiles`;

export const getProfiles = async (params?: ProfileQueryParams): Promise<Profile[]> => {
  const response = await axiosApi.get(PROFILE_ENDPOINT + "/", { params });
  return response?.data?.data;
};

export const getProfileById = async (id: number): Promise<Profile> => {
  const response = await axiosApi.get(`${PROFILE_ENDPOINT}/${id}`);
  return response?.data?.data;
};

export const createProfile = async (profileData: Partial<Profile>): Promise<ProfileResponse> => {
  const response = await axiosApi.post(PROFILE_ENDPOINT + "/", profileData);
  return response?.data;
};

export const updateProfile = async (profileId: number, profileData: Partial<Profile>): Promise<ProfileResponse> => {
  const response = await axiosApi.put(`${PROFILE_ENDPOINT}/${profileId}`, profileData);
  return response?.data;
};

export const deleteProfile = async (profileId: number): Promise<ProfileResponse> => {
  const response = await axiosApi.delete(`${PROFILE_ENDPOINT}/${profileId}`);
  return response?.data;
};

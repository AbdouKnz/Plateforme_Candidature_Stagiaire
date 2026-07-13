"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
} from "@/service/profiles";
import { Profile, ProfileResponse, ProfileQueryParams } from "@/models/profile-model";
import { AxiosError } from "axios";
import { AlertEnum } from "@/models/alert-model";
import { useAlertStore } from "@/stores/alert-store";

export function useProfiles(params?: ProfileQueryParams) {
  return useQuery<Profile[], Error>({
    queryKey: ["profiles", params],
    queryFn: () => getProfiles(params),
    retry: 1,
  } as UseQueryOptions<Profile[], Error>);
}

export function useProfile(id: number | undefined | null) {
  const { showAlert } = useAlertStore();

  return useQuery<Profile, AxiosError>({
    queryKey: ["profile", id],
    queryFn: () => getProfileById(id!),
    enabled: !!id,
    retry: 1,
  } as UseQueryOptions<Profile, AxiosError>);
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<ProfileResponse, Error, Partial<Profile>>({
    mutationFn: createProfile,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      showAlert({
        message: data?.message,
        type: AlertEnum.SUCCESS,
      });
    },
    onError: (error: any) => {
      showAlert({
        message: error?.response?.data?.error,
        type: AlertEnum.ERROR,
      });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<ProfileResponse, Error, { id: number; data: Partial<Profile> }>({
    mutationFn: ({ id, data }) => updateProfile(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["profile", variables.id] });
      showAlert({
        message: data?.message,
        type: AlertEnum.SUCCESS,
      });
    },
    onError: (error: any) => {
      showAlert({
        message: error?.response?.data?.error,
        type: AlertEnum.ERROR,
      });
    },
  });
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<ProfileResponse, Error, number>({
    mutationFn: (id) => deleteProfile(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      showAlert({
        message: data?.message,
        type: AlertEnum.SUCCESS,
      });
    },
    onError: (error: any) => {
      showAlert({
        message: error?.response?.data?.error,
        type: AlertEnum.ERROR,
      });
    },
  });
}

"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getDurations,
  getDurationById,
  createDuration,
  updateDuration,
  deleteDuration,
} from "@/service/durations";
import { Duration, DurationResponse, DurationQueryParams } from "@/models/duration-model";
import { AxiosError } from "axios";
import { AlertEnum } from "@/models/alert-model";
import { useAlertStore } from "@/stores/alert-store";

export function useDurations(params?: DurationQueryParams) {
  return useQuery<Duration[], Error>({
    queryKey: ["durations", params],
    queryFn: () => getDurations(params),
    retry: 1,
  } as UseQueryOptions<Duration[], Error>);
}

export function useDuration(id: number | undefined | null) {
  const { showAlert } = useAlertStore();

  return useQuery<Duration, AxiosError>({
    queryKey: ["duration", id],
    queryFn: () => getDurationById(id!),
    enabled: !!id,
    retry: 1,
  } as UseQueryOptions<Duration, AxiosError>);
}

export function useCreateDuration() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<DurationResponse, Error, Partial<Duration>>({
    mutationFn: createDuration,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["durations"] });
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

export function useUpdateDuration() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<DurationResponse, Error, { id: number; data: Partial<Duration> }>({
    mutationFn: ({ id, data }) => updateDuration(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["durations"] });
      queryClient.invalidateQueries({ queryKey: ["duration", variables.id] });
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

export function useDeleteDuration() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<DurationResponse, Error, number>({
    mutationFn: (id) => deleteDuration(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["durations"] });
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

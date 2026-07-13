"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getTechnologies,
  getTechnologyById,
  createTechnology,
  updateTechnology,
  deleteTechnology,
} from "@/service/technologies";
import { Technology, TechnologyResponse, TechnologyQueryParams } from "@/models/technology-model";
import { AxiosError } from "axios";
import { AlertEnum } from "@/models/alert-model";
import { useAlertStore } from "@/stores/alert-store";

export function useTechnologies(params?: TechnologyQueryParams) {
  return useQuery<Technology[], Error>({
    queryKey: ["technologies", params],
    queryFn: () => getTechnologies(params),
    retry: 1,
  } as UseQueryOptions<Technology[], Error>);
}

export function useTechnology(id: number | undefined | null) {
  const { showAlert } = useAlertStore();

  return useQuery<Technology, AxiosError>({
    queryKey: ["technology", id],
    queryFn: () => getTechnologyById(id!),
    enabled: !!id,
    retry: 1,
  } as UseQueryOptions<Technology, AxiosError>);
}

export function useCreateTechnology() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<TechnologyResponse, Error, Partial<Technology>>({
    mutationFn: createTechnology,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["technologies"] });
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

export function useUpdateTechnology() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<TechnologyResponse, Error, { id: number; data: Partial<Technology> }>({
    mutationFn: ({ id, data }) => updateTechnology(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["technologies"] });
      queryClient.invalidateQueries({ queryKey: ["technology", variables.id] });
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

export function useDeleteTechnology() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<TechnologyResponse, Error, number>({
    mutationFn: (id) => deleteTechnology(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["technologies"] });
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

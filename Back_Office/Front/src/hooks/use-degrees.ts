"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getDegrees,
  getDegreeById,
  createDegree,
  updateDegree,
  deleteDegree,
} from "@/service/degrees";
import { Degree, DegreeResponse, DegreeQueryParams } from "@/models/degree-model";
import { AxiosError } from "axios";
import { AlertEnum } from "@/models/alert-model";
import { useAlertStore } from "@/stores/alert-store";

export function useDegrees(params?: DegreeQueryParams) {
  return useQuery<Degree[], Error>({
    queryKey: ["degrees", params],
    queryFn: () => getDegrees(params),
    retry: 1,
  } as UseQueryOptions<Degree[], Error>);
}

export function useDegree(id: number | undefined | null) {
  const { showAlert } = useAlertStore();

  return useQuery<Degree, AxiosError>({
    queryKey: ["degree", id],
    queryFn: () => getDegreeById(id!),
    enabled: !!id,
    retry: 1,
  } as UseQueryOptions<Degree, AxiosError>);
}

export function useCreateDegree() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<DegreeResponse, Error, Partial<Degree>>({
    mutationFn: createDegree,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["degrees"] });
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

export function useUpdateDegree() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<DegreeResponse, Error, { id: number; data: Partial<Degree> }>({
    mutationFn: ({ id, data }) => updateDegree(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["degrees"] });
      queryClient.invalidateQueries({ queryKey: ["degree", variables.id] });
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

export function useDeleteDegree() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<DegreeResponse, Error, number>({
    mutationFn: (id) => deleteDegree(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["degrees"] });
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

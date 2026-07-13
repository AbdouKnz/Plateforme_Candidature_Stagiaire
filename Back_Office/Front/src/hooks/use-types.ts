"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getTypes,
  getTypeById,
  createType,
  updateType,
  deleteType,
} from "@/service/types";
import { Type, TypeResponse, TypeQueryParams } from "@/models/type-model";
import { AxiosError } from "axios";
import { AlertEnum } from "@/models/alert-model";
import { useAlertStore } from "@/stores/alert-store";

export function useTypes(params?: TypeQueryParams) {
  return useQuery<Type[], Error>({
    queryKey: ["types", params],
    queryFn: () => getTypes(params),
    retry: 1,
  } as UseQueryOptions<Type[], Error>);
}

export function useType(id: number | undefined | null) {
  const { showAlert } = useAlertStore();

  return useQuery<Type, AxiosError>({
    queryKey: ["type", id],
    queryFn: () => getTypeById(id!),
    enabled: !!id,
    retry: 1,
  } as UseQueryOptions<Type, AxiosError>);
}

export function useCreateType() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<TypeResponse, Error, Partial<Type>>({
    mutationFn: createType,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["types"] });
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

export function useUpdateType() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<TypeResponse, Error, { id: number; data: Partial<Type> }>({
    mutationFn: ({ id, data }) => updateType(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["types"] });
      queryClient.invalidateQueries({ queryKey: ["type", variables.id] });
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

export function useDeleteType() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<TypeResponse, Error, number>({
    mutationFn: (id) => deleteType(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["types"] });
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

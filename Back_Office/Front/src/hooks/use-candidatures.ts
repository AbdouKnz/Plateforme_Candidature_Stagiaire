"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getCandidatures,
  getCandidatureById,
  getRecentCandidatures,
  createCandidature,
  updateCandidature,
  deleteCandidature,
  getPipeline,
  type PipelineStage,
} from "@/service/candidatures";
import { Candidature, CandidatureResponse, CandidatureQueryParams } from "@/models/candidature-model";
import { AxiosError } from "axios";
import { AlertEnum } from "@/models/alert-model";
import { useAlertStore } from "@/stores/alert-store";

export function useCandidatures(params?: CandidatureQueryParams) {
  return useQuery<Candidature[], Error>({
    queryKey: ["candidatures", params],
    queryFn: () => getCandidatures(params),
    retry: 1,
    refetchInterval: 5000,
  } as UseQueryOptions<Candidature[], Error>);
}

export function useRecentCandidatures() {
  return useQuery<Candidature[], Error>({
    queryKey: ["candidatures", "recent"],
    queryFn: () => getRecentCandidatures(),
    retry: 1,
    refetchInterval: 5000,
  } as UseQueryOptions<Candidature[], Error>);
}

export function useCandidature(id: number | undefined | null) {
  const { showAlert } = useAlertStore();

  return useQuery<Candidature, AxiosError>({
    queryKey: ["candidature", id],
    queryFn: () => getCandidatureById(id!),
    enabled: !!id,
    retry: 1,
  } as UseQueryOptions<Candidature, AxiosError>);
}

export function useCreateCandidature() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<CandidatureResponse, Error, Partial<Candidature>>({
    mutationFn: createCandidature,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["candidatures"] });
      queryClient.invalidateQueries({ queryKey: ["candidatures", "pipeline"] });
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

export function useUpdateCandidature() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<CandidatureResponse, Error, { id: number; data: Partial<Candidature> }>({
    mutationFn: ({ id, data }) => updateCandidature(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["candidatures"] });
      queryClient.invalidateQueries({ queryKey: ["candidatures", "pipeline"] });
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

export function useDeleteCandidature() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<CandidatureResponse, Error, number>({
    mutationFn: (id) => deleteCandidature(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["candidatures"] });
      queryClient.invalidateQueries({ queryKey: ["candidatures", "pipeline"] });
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

export function usePipeline() {
  return useQuery<PipelineStage[], Error>({
    queryKey: ["candidatures", "pipeline"],
    queryFn: () => getPipeline(),
    retry: 1,
    refetchInterval: 5000,
  } as UseQueryOptions<PipelineStage[], Error>);
}

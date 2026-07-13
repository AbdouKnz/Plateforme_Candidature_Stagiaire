"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
} from "@/service/subjects";
import { Subject, SubjectResponse, SubjectQueryParams } from "@/models/subject-model";
import { AxiosError } from "axios";
import { AlertEnum } from "@/models/alert-model";
import { useAlertStore } from "@/stores/alert-store";

export function useSubjects(params?: SubjectQueryParams) {
  return useQuery<Subject[], Error>({
    queryKey: ["subjects", params],
    queryFn: () => getSubjects(params),
    retry: 1,
  } as UseQueryOptions<Subject[], Error>);
}

export function useSubject(id: number | undefined | null) {
  const { showAlert } = useAlertStore();

  return useQuery<Subject, AxiosError>({
    queryKey: ["subject", id],
    queryFn: () => getSubjectById(id!),
    enabled: !!id,
    retry: 1,
  } as UseQueryOptions<Subject, AxiosError>);
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<SubjectResponse, Error, Partial<Subject>>({
    mutationFn: createSubject,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
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

export function useUpdateSubject() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<SubjectResponse, Error, { id: number; data: Partial<Subject> }>({
    mutationFn: ({ id, data }) => updateSubject(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: ["subject", variables.id] });
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

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<SubjectResponse, Error, number>({
    mutationFn: (id) => deleteSubject(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
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

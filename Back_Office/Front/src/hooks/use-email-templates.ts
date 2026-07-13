"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getEmailTemplates,
  getEmailTemplateById,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
} from "@/service/email-templates";
import { EmailTemplate, EmailTemplateResponse, EmailTemplateQueryParams } from "@/models/email-template-model";
import { AxiosError } from "axios";
import { AlertEnum } from "@/models/alert-model";
import { useAlertStore } from "@/stores/alert-store";

const successMessages: Record<string, Record<string, string>> = {
  fr: {
    create: "Modèle d'email créé avec succès",
    update: "Modèle d'email mis à jour avec succès",
    delete: "Modèle d'email supprimé avec succès",
  },
  en: {
    create: "Email template created successfully",
    update: "Email template updated successfully",
    delete: "Email template deleted successfully",
  },
};

const errorMessages: Record<string, Record<string, string>> = {
  fr: {
    create: "Échec de la création du modèle d'email",
    update: "Échec de la mise à jour du modèle d'email",
    delete: "Échec de la suppression du modèle d'email",
  },
  en: {
    create: "Failed to create email template",
    update: "Failed to update email template",
    delete: "Failed to delete email template",
  },
};

function getLang(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("app-language");
    if (saved === "en" || saved === "fr") return saved;
  }
  return "fr";
}

export function useEmailTemplates(params?: EmailTemplateQueryParams) {
  return useQuery<EmailTemplate[], Error>({
    queryKey: ["email-templates", params],
    queryFn: () => getEmailTemplates(params),
    retry: 1,
  } as UseQueryOptions<EmailTemplate[], Error>);
}

export function useEmailTemplate(id: number | undefined | null) {
  const { showAlert } = useAlertStore();

  return useQuery<EmailTemplate, AxiosError>({
    queryKey: ["email-template", id],
    queryFn: () => getEmailTemplateById(id!),
    enabled: !!id,
    retry: 1,
  } as UseQueryOptions<EmailTemplate, AxiosError>);
}

export function useCreateEmailTemplate() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<EmailTemplateResponse, Error, Partial<EmailTemplate>>({
    mutationFn: createEmailTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      showAlert({
        message: successMessages[getLang()].create,
        type: AlertEnum.SUCCESS,
      });
    },
    onError: () => {
      showAlert({
        message: errorMessages[getLang()].create,
        type: AlertEnum.ERROR,
      });
    },
  });
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<EmailTemplateResponse, Error, { id: number; data: Partial<EmailTemplate> }>({
    mutationFn: ({ id, data }) => updateEmailTemplate(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      queryClient.invalidateQueries({ queryKey: ["email-template", variables.id] });
      showAlert({
        message: successMessages[getLang()].update,
        type: AlertEnum.SUCCESS,
      });
    },
    onError: () => {
      showAlert({
        message: errorMessages[getLang()].update,
        type: AlertEnum.ERROR,
      });
    },
  });
}

export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation<EmailTemplateResponse, Error, number>({
    mutationFn: (id) => deleteEmailTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      showAlert({
        message: successMessages[getLang()].delete,
        type: AlertEnum.SUCCESS,
      });
    },
    onError: () => {
      showAlert({
        message: errorMessages[getLang()].delete,
        type: AlertEnum.ERROR,
      });
    },
  });
}

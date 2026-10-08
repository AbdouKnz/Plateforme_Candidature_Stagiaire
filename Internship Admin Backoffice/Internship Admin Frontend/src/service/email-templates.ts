import axiosApi from "@/lib/axios";
import { EmailTemplate, EmailTemplateQueryParams, EmailTemplateResponse } from "@/models/email-template-model";

const EMAIL_TEMPLATE_ENDPOINT = `/email-templates`;

export const getEmailTemplates = async (params?: EmailTemplateQueryParams): Promise<EmailTemplate[]> => {
  const response = await axiosApi.get(EMAIL_TEMPLATE_ENDPOINT + "/", { params });
  return response?.data?.data;
};

export const getEmailTemplateById = async (id: number): Promise<EmailTemplate> => {
  const response = await axiosApi.get(`${EMAIL_TEMPLATE_ENDPOINT}/${id}`);
  return response?.data?.data;
};

export const createEmailTemplate = async (emailTemplateData: Partial<EmailTemplate>): Promise<EmailTemplateResponse> => {
  const response = await axiosApi.post(EMAIL_TEMPLATE_ENDPOINT + "/", emailTemplateData);
  return response?.data;
};

export const updateEmailTemplate = async (id: number, emailTemplateData: Partial<EmailTemplate>): Promise<EmailTemplateResponse> => {
  const response = await axiosApi.put(`${EMAIL_TEMPLATE_ENDPOINT}/${id}`, emailTemplateData);
  return response?.data;
};

export const deleteEmailTemplate = async (id: number): Promise<EmailTemplateResponse> => {
  const response = await axiosApi.delete(`${EMAIL_TEMPLATE_ENDPOINT}/${id}`);
  return response?.data;
};
import axiosApi from "@/lib/axios";
import type { MailConfig, MailConfigResponse } from "@/models/mail-config-model";

const ENDPOINT = `/mail-config`;

export const getMailConfig = async (): Promise<MailConfig> => {
  const response = await axiosApi.get(ENDPOINT + "/");
  return response?.data?.data;
};

export const updateMailConfig = async (data: Partial<MailConfig>): Promise<MailConfigResponse> => {
  const response = await axiosApi.put(ENDPOINT + "/", data);
  return response?.data;
};

export const testMailConfig = async (data: Partial<MailConfig>): Promise<MailConfigResponse> => {
  const response = await axiosApi.post(ENDPOINT + "/test", data);
  return response?.data;
};
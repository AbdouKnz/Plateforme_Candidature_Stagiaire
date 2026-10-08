import axiosApi from "@/lib/axios";

export interface EmailFooter {
  phone?: string;
  email?: string;
  linkedin?: string;
  website?: string;
  address_url?: string;
}

const ENDPOINT = `/email-footer`;

export const getEmailFooter = async (): Promise<EmailFooter> => {
  const response = await axiosApi.get(ENDPOINT + "/");
  return response?.data?.data;
};

export const updateEmailFooter = async (data: EmailFooter) => {
  const response = await axiosApi.put(ENDPOINT + "/", data);
  return response?.data;
};

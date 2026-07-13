import axiosApi from "@/lib/axios";

export interface FrontOfficeStatus {
  is_enabled: boolean;
  reopening_date?: string;
}

export const toggleFrontOffice = async (data: { is_enabled: boolean; reopening_date?: string }) => {
  const response = await axiosApi.put("/front-office/toggle", data);
  return response?.data;
};

export const getFrontOfficeStatus = async (): Promise<FrontOfficeStatus> => {
  const response = await axiosApi.get("/public/front-office/status");
  return response?.data?.data;
};

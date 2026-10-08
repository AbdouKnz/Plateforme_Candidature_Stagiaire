import axiosApi from "@/lib/axios";

export interface FrontOfficeStatus {
  is_enabled: boolean;
  reopening_date?: string;
  year?: string;
  internship_title?: string;
  footer_phone?: string;
  footer_email?: string;
  footer_linkedin?: string;
  footer_website?: string;
  footer_privacy_url?: string;
  footer_terms_url?: string;
}

export interface FrontOfficeFooter {
  footer_phone?: string;
  footer_email?: string;
  footer_linkedin?: string;
  footer_website?: string;
  footer_privacy_url?: string;
  footer_terms_url?: string;
}

export const toggleFrontOffice = async (data: { is_enabled: boolean; reopening_date?: string; year?: string; internship_title?: string }) => {
  const response = await axiosApi.put("/front-office/toggle", data);
  return response?.data;
};

export const updateFrontOfficeFooter = async (data: FrontOfficeFooter) => {
  const response = await axiosApi.put("/front-office/footer", data);
  return response?.data;
};

export const getFrontOfficeStatus = async (): Promise<FrontOfficeStatus> => {
  const response = await axiosApi.get("/public/front-office/status");
  return response?.data?.data;
};

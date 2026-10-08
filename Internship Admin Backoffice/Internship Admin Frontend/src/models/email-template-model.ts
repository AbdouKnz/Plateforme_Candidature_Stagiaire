import type { ApiResponse } from "./api";

export interface EmailTemplate {
  id: number;
  type: string;
  subject: string;
  body: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplateQueryParams {
  search?: string;
}

export type EmailTemplateResponse = ApiResponse<EmailTemplate>;

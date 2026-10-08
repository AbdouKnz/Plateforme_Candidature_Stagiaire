import type { ApiResponse } from "./api";

export interface EmailLog {
  id: number;
  candidature_id: number;
  recipient: string;
  subject: string;
  body: string;
  template_type: string;
  candidat_name: string;
  subject_name: string;
  status: string;
  sent_at: string;
  bcc: string;
}

export interface EmailLogQueryParams {
  search?: string;
  page?: number;
  pageSize?: number;
  template_type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

export interface EmailLogPagination {
  page: number;
  pageSize: number;
  totalRows: number;
  totalPages: number;
}

export interface EmailLogListResponse {
  data: EmailLog[];
  pagination: EmailLogPagination;
}

export type EmailLogResponse = ApiResponse<EmailLog>;
import type { ApiResponse } from "./api";

export interface Duration {
  id: number;
  name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface DurationQueryParams {
  search?: string;
  status?: boolean;
}

export type DurationResponse = ApiResponse<Duration>;
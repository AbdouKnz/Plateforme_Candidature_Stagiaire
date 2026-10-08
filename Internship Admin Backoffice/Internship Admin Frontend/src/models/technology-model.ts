import type { ApiResponse } from "./api";

export interface Technology {
  id: number;
  name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface TechnologyQueryParams {
  search?: string;
  status?: boolean;
}

export type TechnologyResponse = ApiResponse<Technology>;
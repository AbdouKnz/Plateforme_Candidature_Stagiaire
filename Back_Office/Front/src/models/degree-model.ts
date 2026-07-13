import type { ApiResponse } from "./api";

export interface Degree {
  id: number;
  name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface DegreeQueryParams {
  search?: string;
  status?: boolean;
}

export type DegreeResponse = ApiResponse<Degree>;
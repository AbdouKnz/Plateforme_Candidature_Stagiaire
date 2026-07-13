import type { ApiResponse } from "./api";

export interface Type {
  id: number;
  name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface TypeQueryParams {
  search?: string;
  status?: boolean;
}

export type TypeResponse = ApiResponse<Type>;